import { GazeFixationDetectorIDT } from 'develex-js-sdk';
import type { FixationDataPoint, GazeDataPoint } from 'develex-js-sdk';
import type { RawGazeDataEntry } from '$lib/database/db.types';
import {
	DEFAULT_DETECTOR_PARAMS,
	type DetectorParams,
	type FixationDetector,
	type ReplayFixationEvent
} from '../types';

/**
 * Rebuilds the SDK input shape from a stored raw sample. The screen-relative
 * fields only feed unused output fields of the detector, so they stay 0.
 */
export function toGazeDataPoint(raw: RawGazeDataEntry): GazeDataPoint {
	return {
		type: 'gaze',
		deviceId: 'replay',
		sessionId: raw.session_id,
		parseValidity: true,
		timestamp: raw.bridgeTimeStamp,
		deviceTimestamp: raw.deviceTimeStamp,
		x: raw.x,
		y: raw.y,
		xL: raw.xL,
		yL: raw.yL,
		validityL: raw.validityL,
		pupilDiameterL: raw.pupilDiameterL,
		xR: raw.xR,
		yR: raw.yR,
		validityR: raw.validityR,
		pupilDiameterR: raw.pupilDiameterR,
		xLScreenRelative: 0,
		yLScreenRelative: 0,
		xRScreenRelative: 0,
		yRScreenRelative: 0
	};
}

function toReplayEvent(fixation: FixationDataPoint): ReplayFixationEvent {
	return {
		fixationId: fixation.fixationId,
		x: fixation.x,
		y: fixation.y,
		duration: fixation.duration
	};
}

/** Runs the exact detector implementation used by live sessions. */
export class IdtFixationDetector implements FixationDetector {
	private detector: GazeFixationDetectorIDT;

	constructor(params: DetectorParams = DEFAULT_DETECTOR_PARAMS) {
		this.detector = new GazeFixationDetectorIDT(
			params.minimumFixationDurationMs,
			params.maximumFixationDispersionDeg,
			params.distanceFromScreenCm,
			params.dpi
		);
	}

	onFixationStart(callback: (fixation: ReplayFixationEvent) => void): void {
		this.detector.on('fixationStart', (fixation) => callback(toReplayEvent(fixation)));
	}

	onFixationEnd(callback: (fixation: ReplayFixationEvent) => void): void {
		this.detector.on('fixationEnd', (fixation) => callback(toReplayEvent(fixation)));
	}

	process(sample: RawGazeDataEntry): void {
		this.detector.processGazePoint(toGazeDataPoint(sample));
	}

	flush(): void {
		this.detector.processGazePoint(null as unknown as GazeDataPoint);
	}

	reset(): void {
		this.detector.reset();
	}
}
