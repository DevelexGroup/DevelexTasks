import type {
	FixationDataEntry,
	GazeSampleDataEntry,
	RawGazeDataEntry,
	SessionScoreDataEntry,
	SessionScoreMetrics
} from '$lib/database/db.types';
import type { SlideTimeWindow } from '$lib/utils/scoreMetrics';

/** Row-major 4×4 homogeneous matrix in viewport pixels, applied to (x, y, 0, 1). */
export type CorrectionMatrix = [
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number
];

export interface SpatialCorrection {
	offsetX: number;
	offsetY: number;
	scaleX: number;
	scaleY: number;
	centerX: number;
	centerY: number;
	/** When true, `matrix` replaces offset/scale entirely. */
	useMatrix?: boolean;
	matrix?: CorrectionMatrix;
}

export interface SlideCorrectionMap {
	sessionDefault: SpatialCorrection;
	perSlide: Map<number, SpatialCorrection>;
}

export interface LoadedSession {
	childId: string;
	sessionId: string;
	taskName: string;
	gazeSamples: GazeSampleDataEntry[];
	fixationData: FixationDataEntry[];
	/** Server-side I2MC reference fixations (I2MC_fixationData_slideN.csv), if present. */
	i2mcFixationData: FixationDataEntry[];
	sessionScores: SessionScoreDataEntry[];
	rawGazeData: RawGazeDataEntry[];
	/** AOI geometry recorded during the session (aoiGeometry_slideN.json), if present. */
	recordedGeometry: RecordedSlideGeometry[];
	/** Info extracted from the session's meta.json, if present. */
	meta: RecordedSessionMeta | null;
	maxSlides: number;
	warnings: string[];
}

/** The sim-relevant subset of the recorded meta.json. */
export interface RecordedSessionMeta {
	/** Browser viewport (innerWidth × innerHeight) at recording time. */
	viewport: { width: number; height: number } | null;
	measuredFrequencyHz: number | null;
	/** Raw sample counts per slide as recorded live. */
	samplesPerSlide: Record<number, number>;
}

export interface AoiRect {
	id: string;
	left: number;
	top: number;
	right: number;
	bottom: number;
	bufferSize: number;
	synthetic?: boolean;
	/** Validity interval in epoch ms; missing bound = open-ended. */
	fromTs?: number;
	toTs?: number;
}

/** One aoiGeometry_slideN.json recorded during a live session. */
export interface RecordedSlideGeometry {
	slideIndex: number;
	stimulusId: string | null;
	viewport: { width: number; height: number };
	aois: AoiRect[];
}

export interface SlideGeometry {
	slideIndex: number;
	stimulusId: string;
	aois: AoiRect[];
	viewport: { width: number; height: number };
	approximate: boolean;
}

export interface ReplayFixationEvent {
	fixationId: number;
	x: number;
	y: number;
	duration: number;
	timestamp: string;
	deviceTimestamp: string;
}

export interface FixationDetector {
	onFixationStart(callback: (fixation: ReplayFixationEvent) => void): void;
	onFixationEnd(callback: (fixation: ReplayFixationEvent) => void): void;
	process(sample: RawGazeDataEntry): void;
	/** Finish an in-progress fixation at the end of the stream. */
	flush(): void;
	reset(): void;
}

export interface DetectorParams {
	minimumFixationDurationMs: number;
	maximumFixationDispersionDeg: number;
	distanceFromScreenCm: number;
	dpi: number;
}

/** Matches the live SDK detector defaults. */
export const DEFAULT_DETECTOR_PARAMS: DetectorParams = {
	minimumFixationDurationMs: 100,
	maximumFixationDispersionDeg: 1.35,
	distanceFromScreenCm: 70,
	dpi: 96
};

/** A recomputed fixation; endTimestamp is the sample that closed it. */
export interface ReplayFixation extends FixationDataEntry {
	endTimestamp: number;
}

export interface FixationPostProcessor {
	name: string;
	apply(fixations: ReplayFixation[]): ReplayFixation[];
}

export type AoiAttributionStrategy = 'snapshot-at-start' | 'centroid';

/** Recording gap the live detector never saw (pause, lost slide-boundary samples). */
export interface StreamGap {
	from: number;
	to: number;
	durationMs: number;
}

/** Well above sampling jitter, below the shortest realistic pause. */
export const DEFAULT_GAP_RESET_MS = 200;

export interface ReplayOptions {
	detectorParams: DetectorParams;
	postProcessors: FixationPostProcessor[];
	aoiAttribution: AoiAttributionStrategy;
	/** Live sessions never persist the fixation still in progress at session end. */
	dropUnfinishedFinalFixation: boolean;
	/**
	 * Live scores a slide in the tick that completes it, so a fixation still
	 * running at that moment is stored too late to be counted anywhere.
	 */
	countFixationsOpenAtWindowEnd: boolean;
	/** Restart the detector when consecutive samples are farther apart than this; 0 disables. */
	gapResetMs: number;
	/** The fixation already running when recording started was never logged live. */
	dropColdStartFixation: boolean;
	/**
	 * Re-stamp raw samples with the bridge clock (median-offset aligned) and
	 * record fixation onsets instead of confirmation times. Undoes main-thread
	 * stamping bursts; timestamps then stop matching the live rows.
	 */
	rebaseRawTimestamps: boolean;
}

export function defaultReplayOptions(): ReplayOptions {
	return {
		detectorParams: { ...DEFAULT_DETECTOR_PARAMS },
		postProcessors: [],
		aoiAttribution: 'snapshot-at-start',
		dropUnfinishedFinalFixation: true,
		countFixationsOpenAtWindowEnd: false,
		gapResetMs: DEFAULT_GAP_RESET_MS,
		dropColdStartFixation: false,
		rebaseRawTimestamps: false
	};
}

export type FluencyResolver = (metrics: Partial<SessionScoreMetrics>, stimulusId: string) => number;

export interface ReplaySlideResult {
	window: SlideTimeWindow | null;
	/** Fixations the slide score counts (inside the effective window). */
	fixations: ReplayFixation[];
	/** Every fixation attributed to the slide, including those outside the window. */
	allFixations: ReplayFixation[];
}

export interface ReplayResult {
	fixations: ReplayFixation[];
	gazeSamples: GazeSampleDataEntry[];
	rawGazeData: RawGazeDataEntry[];
	sessionScores: SessionScoreDataEntry[];
	perSlide: Map<number, ReplaySlideResult>;
	warnings: string[];
}
