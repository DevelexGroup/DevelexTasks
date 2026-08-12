import type {
	GazeSampleDataEntry,
	SessionScoreDataEntry,
	SessionScoreMetrics
} from '$lib/database/db.types';
import {
	type SlideTimeWindow,
	calculateAOIFieldFixations,
	calculateAOITargetFixations,
	calculateErrorRate,
	calculateMeanFixationDuration,
	calculateRegressionCount,
	calculateResponseTime,
	filterFixationsInWindow,
	filterSamplesInWindow,
	getEffectiveTimeWindow
} from '$lib/utils/scoreMetrics';
import { runFixationPipeline } from './fixation/pipeline';
import { rebaseOnBridgeClock } from './timebase';
import { applyCorrection } from './transform';
import type {
	FixationDetector,
	FluencyResolver,
	LoadedSession,
	ReplayFixation,
	ReplayOptions,
	ReplayResult,
	ReplaySlideResult,
	SlideCorrectionMap,
	SlideGeometry
} from './types';

export interface ReplayInput {
	session: LoadedSession;
	corrections: SlideCorrectionMap;
	geometryBySlide: Map<number, SlideGeometry>;
	options: ReplayOptions;
	fluency?: FluencyResolver;
	detector?: FixationDetector;
}

function byTimestamp<T extends { timestamp: number }>(entries: T[]): T[] {
	return [...entries].sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Live computes a slide's score in the tick that completes it, so a fixation
 * still running at that moment is never part of it.
 */
function fixationsForWindow(
	fixations: ReplayFixation[],
	window: SlideTimeWindow,
	options: ReplayOptions
): ReplayFixation[] {
	const started = filterFixationsInWindow(fixations, window);
	if (options.countFixationsOpenAtWindowEnd) return started;
	return started.filter((fixation) => fixation.endTimestamp <= window.endTime);
}

export function runReplay(input: ReplayInput): ReplayResult {
	const warnings: string[] = [];
	const gazeSamples = byTimestamp(input.session.gazeSamples);

	let rawSource = input.session.rawGazeData;
	if (input.options.rebaseRawTimestamps) {
		const rebase = rebaseOnBridgeClock(rawSource);
		rawSource = rebase.rows;
		if (rebase.skipped > 0) {
			warnings.push(
				`Přerazítkování: ${rebase.skipped} vzorků nemá platný bridge čas a zůstalo beze změny.`
			);
		}
	}
	const rawGazeData = byTimestamp(rawSource);

	// Event-marker windows are the authoritative slide timeline
	const slideIndices = [...new Set(gazeSamples.map((row) => row.slide_index))]
		.filter((slide) => slide >= 0)
		.sort((a, b) => a - b);
	const windows = new Map<number, SlideTimeWindow>();
	for (const slide of slideIndices) {
		const window = getEffectiveTimeWindow(gazeSamples, slide);
		if (window) windows.set(slide, window);
		else warnings.push(`Slide ${slide} has no complete event-marker window.`);
	}

	const orderedWindows = [...windows.values()].sort((a, b) => a.startTime - b.startTime);
	const slideForTimestamp = (timestamp: number, fallback: number): number => {
		for (const window of orderedWindows) {
			if (timestamp >= window.startTime && timestamp <= window.endTime) return window.slideIndex;
		}
		return fallback;
	};

	const stimulusBySlide = new Map<number, string>();
	for (const window of orderedWindows) {
		const first = gazeSamples.find(
			(row) => row.timestamp >= window.startTime && row.timestamp <= window.endTime
		);
		stimulusBySlide.set(window.slideIndex, first?.stimulus_id ?? 'null');
	}
	const stimulusForSlide = (slide: number): string => {
		const known = stimulusBySlide.get(slide);
		if (known) return known;
		const row = gazeSamples.find(
			(sample) => sample.slide_index === slide && sample.stimulus_id !== 'null'
		);
		return row?.stimulus_id ?? 'null';
	};

	for (const window of orderedWindows) {
		if (!input.geometryBySlide.has(window.slideIndex)) {
			warnings.push(
				`Slide ${window.slideIndex} has no AOI geometry; AOI sets were not recomputed.`
			);
		}
	}

	const pipeline = runFixationPipeline({
		rawGazeData,
		corrections: input.corrections,
		geometryBySlide: input.geometryBySlide,
		slideForTimestamp,
		stimulusForSlide,
		options: input.options,
		detector: input.detector
	});

	// Regenerate gaze samples: identity fields and events stay, coordinates are
	// corrected, and the AOI column is re-derived from the last raw sample's
	// recomputed intersect set (live rows mirror exactly that state).
	const regenerated: GazeSampleDataEntry[] = [];
	let rawPointer = -1;
	for (const row of gazeSamples) {
		while (
			rawPointer + 1 < pipeline.aoiTimeline.length &&
			pipeline.aoiTimeline[rawPointer + 1].timestamp <= row.timestamp
		) {
			rawPointer++;
		}

		const slide = slideForTimestamp(row.timestamp, row.slide_index);
		const inWindow = windows.has(slide) && slideForTimestamp(row.timestamp, -1) === slide;
		const correction = input.corrections.perSlide.get(slide) ?? input.corrections.sessionDefault;

		const next: GazeSampleDataEntry = { ...row, aoi: [...row.aoi] };
		if (row.eyetracker_x !== null && row.eyetracker_y !== null) {
			const corrected = applyCorrection(row.eyetracker_x, row.eyetracker_y, correction);
			next.eyetracker_x = corrected.x;
			next.eyetracker_y = corrected.y;
		}

		if (inWindow && rawPointer >= 0) {
			const timelineAoi = pipeline.aoiTimeline[rawPointer].aoi;
			if (timelineAoi !== null) next.aoi = [...timelineAoi];
		}

		regenerated.push(next);
	}

	// Recompute session scores per window with live per-slide semantics
	const sessionScores: SessionScoreDataEntry[] = [];
	for (const window of orderedWindows) {
		const windowedSamples = filterSamplesInWindow(regenerated, window);
		const windowedFixations = fixationsForWindow(pipeline.fixations, window, input.options);

		const metrics: SessionScoreMetrics = {
			error_rate: calculateErrorRate(windowedSamples),
			response_time: calculateResponseTime(windowedSamples),
			mean_fix_dur: calculateMeanFixationDuration(windowedFixations),
			fix_count: windowedFixations.length,
			aoi_target_fix: calculateAOITargetFixations(windowedFixations),
			aoi_field_fix: calculateAOIFieldFixations(windowedFixations),
			regression_count: calculateRegressionCount(windowedFixations)
		};

		const stimulusId = windowedSamples.length > 0 ? windowedSamples[0].stimulus_id : 'null';
		sessionScores.push({
			child_id: input.session.childId,
			session_id: input.session.sessionId,
			task_name: input.session.taskName,
			slide_index: window.slideIndex,
			stimulus_id: stimulusId,
			timestamp: window.endTime,
			...metrics,
			fluency_score: input.fluency ? input.fluency(metrics, stimulusId) : 0
		});
	}

	const perSlide = new Map<number, ReplaySlideResult>();
	for (const slide of slideIndices) {
		const window = windows.get(slide) ?? null;
		perSlide.set(slide, {
			window,
			fixations: window ? fixationsForWindow(pipeline.fixations, window, input.options) : []
		});
	}

	if (pipeline.gaps.length > 0) {
		const longest = Math.round(Math.max(...pipeline.gaps.map((gap) => gap.durationMs)));
		warnings.push(
			`Záznam má ${pipeline.gaps.length} mezer(y) delších než ${input.options.gapResetMs} ms (nejdelší ${longest} ms); detektor se na nich restartuje.`
		);
	}

	const pausedSlides = new Set<number>();
	for (const row of gazeSamples) {
		if (row.events?.includes('pause_logging')) {
			pausedSlides.add(slideForTimestamp(row.timestamp, row.slide_index));
		}
	}
	if (pausedSlides.size > 0) {
		warnings.push(
			`Logování bylo pozastaveno na slidech ${[...pausedSlides].sort((a, b) => a - b).join(', ')} – vzorky z pauzy v datech nejsou.`
		);
	}

	return {
		fixations: pipeline.fixations,
		gazeSamples: regenerated,
		rawGazeData: pipeline.transformedRaw,
		sessionScores,
		perSlide,
		warnings
	};
}
