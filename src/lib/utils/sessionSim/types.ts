import type {
	FixationDataEntry,
	GazeSampleDataEntry,
	RawGazeDataEntry,
	SessionScoreDataEntry,
	SessionScoreMetrics
} from '$lib/database/db.types';
import type { SlideTimeWindow } from '$lib/utils/scoreMetrics';

export interface SpatialCorrection {
	offsetX: number;
	offsetY: number;
	scaleX: number;
	scaleY: number;
	centerX: number;
	centerY: number;
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
	sessionScores: SessionScoreDataEntry[];
	rawGazeData: RawGazeDataEntry[];
	maxSlides: number;
	warnings: string[];
}

export interface AoiRect {
	id: string;
	left: number;
	top: number;
	right: number;
	bottom: number;
	bufferSize: number;
	synthetic?: boolean;
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

export interface FixationPostProcessor {
	name: string;
	apply(fixations: FixationDataEntry[]): FixationDataEntry[];
}

export type AoiAttributionStrategy = 'snapshot-at-start' | 'centroid';

export interface ReplayOptions {
	detectorParams: DetectorParams;
	postProcessors: FixationPostProcessor[];
	aoiAttribution: AoiAttributionStrategy;
	/** Live sessions never persist the fixation still in progress at session end. */
	dropUnfinishedFinalFixation: boolean;
}

export function defaultReplayOptions(): ReplayOptions {
	return {
		detectorParams: { ...DEFAULT_DETECTOR_PARAMS },
		postProcessors: [],
		aoiAttribution: 'snapshot-at-start',
		dropUnfinishedFinalFixation: true
	};
}

export type FluencyResolver = (metrics: Partial<SessionScoreMetrics>, stimulusId: string) => number;

export interface ReplaySlideResult {
	window: SlideTimeWindow | null;
	fixations: FixationDataEntry[];
}

export interface ReplayResult {
	fixations: FixationDataEntry[];
	gazeSamples: GazeSampleDataEntry[];
	rawGazeData: RawGazeDataEntry[];
	sessionScores: SessionScoreDataEntry[];
	perSlide: Map<number, ReplaySlideResult>;
	warnings: string[];
}
