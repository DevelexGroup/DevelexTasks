import type { RawGazeDataEntry } from '$lib/database/db.types';
import type { SpatialCorrection } from './types';

export function identityCorrection(centerX = 0, centerY = 0): SpatialCorrection {
	return { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, centerX, centerY };
}

export function isIdentity(correction: SpatialCorrection): boolean {
	return (
		correction.offsetX === 0 &&
		correction.offsetY === 0 &&
		correction.scaleX === 1 &&
		correction.scaleY === 1
	);
}

export function applyCorrection(
	x: number,
	y: number,
	correction: SpatialCorrection
): { x: number; y: number } {
	return {
		x: (x - correction.centerX) * correction.scaleX + correction.centerX + correction.offsetX,
		y: (y - correction.centerY) * correction.scaleY + correction.centerY + correction.offsetY
	};
}

export function invertCorrection(correction: SpatialCorrection): SpatialCorrection {
	return {
		offsetX: -correction.offsetX / correction.scaleX,
		offsetY: -correction.offsetY / correction.scaleY,
		scaleX: 1 / correction.scaleX,
		scaleY: 1 / correction.scaleY,
		centerX: correction.centerX,
		centerY: correction.centerY
	};
}

/**
 * Transforms the combined and per-eye coordinates of a raw sample.
 * Samples with both eyes invalid pass through untouched — their coordinates
 * are a calibration artifact, not gaze.
 */
export function transformRawEntry(
	entry: RawGazeDataEntry,
	correction: SpatialCorrection
): RawGazeDataEntry {
	if (!entry.validityL && !entry.validityR) return { ...entry };
	if (isIdentity(correction)) return { ...entry };

	const combined = applyCorrection(entry.x, entry.y, correction);
	const left = applyCorrection(entry.xL, entry.yL, correction);
	const right = applyCorrection(entry.xR, entry.yR, correction);

	return {
		...entry,
		x: combined.x,
		y: combined.y,
		xL: left.x,
		yL: left.y,
		xR: right.x,
		yR: right.y
	};
}
