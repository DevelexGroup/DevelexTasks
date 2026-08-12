import type { RawGazeDataEntry } from '$lib/database/db.types';
import { hitTestAll } from '../aoi/hitTest';
import { transformRawEntry } from '../transform';
import type {
	ReplayOptions,
	SlideCorrectionMap,
	SlideGeometry,
	FixationDetector,
	ReplayFixation,
	StreamGap
} from '../types';
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
	fixations: ReplayFixation[];
	transformedRaw: RawGazeDataEntry[];
	aoiTimeline: AoiTimelineEntry[];
	gaps: StreamGap[];
}

/** The detector measures durations from device timestamps, so gaps are found there too. */
function deviceMs(sample: RawGazeDataEntry): number {
	const parsed = Date.parse(sample.deviceTimeStamp);
	return Number.isNaN(parsed) ? sample.timestamp : parsed;
}

/**
 * Single pass over the raw stream replicating the live semantics: the AOI
 * intersect set updates on every sample (including invalid ones at their
 * recorded coordinates), a fixation entry snapshots state at fixationStart,
 * and fixationEnd only finalizes the duration.
 */
export function runFixationPipeline(input: FixationPipelineInput): FixationPipelineResult {
	const detector = input.detector ?? new IdtFixationDetector(input.options.detectorParams);
	const pending = new Map<number, ReplayFixation>();
	const finished: ReplayFixation[] = [];
	const gaps: StreamGap[] = [];

	let currentSample: RawGazeDataEntry | null = null;
	let currentSlide = -1;
	let currentAoi: string[] | null = null;

	let firstDeviceMs: number | null = null;
	let sampleIntervalMs = 0;
	let firstFixationSeen = false;
	let coldStartFixationId: number | null = null;

	detector.onFixationStart((fixation) => {
		if (!currentSample) return;

		if (!firstFixationSeen) {
			firstFixationSeen = true;
			// A window reaching the minimum duration this early still holds the very
			// first sample, so the fixation really began before the recording did.
			const headroom = input.options.detectorParams.minimumFixationDurationMs + sampleIntervalMs;
			if (firstDeviceMs !== null && deviceMs(currentSample) <= firstDeviceMs + headroom) {
				coldStartFixationId = fixation.fixationId;
			}
		}

		// The start event fires once the window reaches the minimum duration, so
		// in rebase mode the onset is that far back from the current sample.
		const startedAt = input.options.rebaseRawTimestamps
			? currentSample.timestamp - fixation.duration
			: currentSample.timestamp;

		pending.set(fixation.fixationId, {
			child_id: currentSample.child_id,
			session_id: currentSample.session_id,
			task_name: currentSample.task_name,
			slide_index: currentSlide,
			stimulus_id: input.stimulusForSlide(currentSlide),
			timestamp: startedAt,
			eyetracker_x: fixation.x,
			eyetracker_y: fixation.y,
			duration: fixation.duration,
			aoi: currentAoi ? [...currentAoi] : [],
			fixation_index: fixation.fixationId,
			endTimestamp: currentSample.timestamp
		});
	});

	detector.onFixationEnd((fixation) => {
		const entry = pending.get(fixation.fixationId);
		if (!entry) return;
		pending.delete(fixation.fixationId);
		entry.duration = fixation.duration;
		if (currentSample) entry.endTimestamp = currentSample.timestamp;

		if (input.options.aoiAttribution === 'centroid') {
			const geometry = input.geometryBySlide.get(entry.slide_index);
			if (geometry) entry.aoi = hitTestAll(fixation.x, fixation.y, geometry.aois);
		}

		finished.push(entry);
	});

	const transformedRaw: RawGazeDataEntry[] = [];
	const aoiTimeline: AoiTimelineEntry[] = [];

	let previousDeviceMs: number | null = null;
	let previousTimestamp = 0;

	for (const sample of input.rawGazeData) {
		const slide = input.slideForTimestamp(sample.timestamp, sample.slide_index);
		const correction = input.corrections.perSlide.get(slide) ?? input.corrections.sessionDefault;
		const corrected = transformRawEntry(sample, correction);

		const sampleDeviceMs = deviceMs(sample);
		if (previousDeviceMs === null) {
			firstDeviceMs = sampleDeviceMs;
		} else {
			const delta = sampleDeviceMs - previousDeviceMs;
			if (delta > 0) {
				sampleIntervalMs = sampleIntervalMs === 0 ? delta : Math.min(sampleIntervalMs, delta);
			}
			if (input.options.gapResetMs > 0 && delta > input.options.gapResetMs) {
				gaps.push({ from: previousTimestamp, to: sample.timestamp, durationMs: delta });
				// Closes the running fixation on the last sample before the gap instead
				// of stitching the two sides into one over-long fixation.
				detector.flush();
			}
		}
		previousDeviceMs = sampleDeviceMs;
		previousTimestamp = sample.timestamp;

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
	if (input.options.dropColdStartFixation && coldStartFixationId !== null) {
		fixations = fixations.filter((entry) => entry.fixation_index !== coldStartFixationId);
	}
	for (const postProcessor of input.options.postProcessors) {
		fixations = postProcessor.apply(fixations);
	}

	return { fixations, transformedRaw, aoiTimeline, gaps };
}
