import type { FixationDataEntry, RawGazeDataEntry } from '$lib/database/db.types';
import { hitTestAll } from '../aoi/hitTest';
import { transformRawEntry } from '../transform';
import type { ReplayOptions, SlideCorrectionMap, SlideGeometry, FixationDetector } from '../types';
import { IdtFixationDetector } from './idtAdapter';

export interface FixationPipelineInput {
	/** Sorted by timestamp ascending. */
	rawGazeData: RawGazeDataEntry[];
	corrections: SlideCorrectionMap;
	geometryBySlide: Map<number, SlideGeometry>;
	/** Authoritative slide assignment (event-marker windows); falls back to the sample's own index. */
	slideForTimestamp: (timestamp: number, fallback: number) => number;
	stimulusForSlide: (slideIndex: number) => string;
	options: ReplayOptions;
	detector?: FixationDetector;
}

export interface AoiTimelineEntry {
	timestamp: number;
	/** null = no geometry available for this sample's slide, AOI state unknown. */
	aoi: string[] | null;
}

export interface FixationPipelineResult {
	fixations: FixationDataEntry[];
	transformedRaw: RawGazeDataEntry[];
	aoiTimeline: AoiTimelineEntry[];
}

/**
 * Single pass over the raw stream replicating the live semantics: the AOI
 * intersect set updates on every sample (including invalid ones at their
 * recorded coordinates), a fixation entry snapshots state at fixationStart,
 * and fixationEnd only finalizes the duration.
 */
export function runFixationPipeline(input: FixationPipelineInput): FixationPipelineResult {
	const detector = input.detector ?? new IdtFixationDetector(input.options.detectorParams);
	const pending = new Map<number, FixationDataEntry>();
	const finished: FixationDataEntry[] = [];

	let currentSample: RawGazeDataEntry | null = null;
	let currentSlide = -1;
	let currentAoi: string[] | null = null;

	detector.onFixationStart((fixation) => {
		if (!currentSample) return;
		pending.set(fixation.fixationId, {
			child_id: currentSample.child_id,
			session_id: currentSample.session_id,
			task_name: currentSample.task_name,
			slide_index: currentSlide,
			stimulus_id: input.stimulusForSlide(currentSlide),
			timestamp: currentSample.timestamp,
			eyetracker_x: fixation.x,
			eyetracker_y: fixation.y,
			duration: fixation.duration,
			aoi: currentAoi ? [...currentAoi] : [],
			fixation_index: fixation.fixationId
		});
	});

	detector.onFixationEnd((fixation) => {
		const entry = pending.get(fixation.fixationId);
		if (!entry) return;
		pending.delete(fixation.fixationId);
		entry.duration = fixation.duration;

		if (input.options.aoiAttribution === 'centroid') {
			const geometry = input.geometryBySlide.get(entry.slide_index);
			if (geometry) entry.aoi = hitTestAll(fixation.x, fixation.y, geometry.aois);
		}

		finished.push(entry);
	});

	const transformedRaw: RawGazeDataEntry[] = [];
	const aoiTimeline: AoiTimelineEntry[] = [];

	for (const sample of input.rawGazeData) {
		const slide = input.slideForTimestamp(sample.timestamp, sample.slide_index);
		const correction = input.corrections.perSlide.get(slide) ?? input.corrections.sessionDefault;
		const corrected = transformRawEntry(sample, correction);

		currentSample = corrected;
		currentSlide = slide;

		const geometry = input.geometryBySlide.get(slide);
		currentAoi = geometry ? hitTestAll(corrected.x, corrected.y, geometry.aois) : null;

		aoiTimeline.push({ timestamp: sample.timestamp, aoi: currentAoi });
		transformedRaw.push(corrected);
		detector.process(corrected);
	}

	if (input.options.dropUnfinishedFinalFixation) {
		pending.clear();
	} else {
		detector.flush();
	}

	let fixations = finished.sort(
		(a, b) => a.timestamp - b.timestamp || a.fixation_index - b.fixation_index
	);
	for (const postProcessor of input.options.postProcessors) {
		fixations = postProcessor.apply(fixations);
	}

	return { fixations, transformedRaw, aoiTimeline };
}
