import type { RawGazeDataEntry } from '$lib/database/db.types';
import type { CorrectionMatrix, SpatialCorrection } from './types';

export const IDENTITY_MATRIX: CorrectionMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export function identityCorrection(centerX = 0, centerY = 0): SpatialCorrection {
	return { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, centerX, centerY };
}

export function isIdentityMatrix(matrix?: CorrectionMatrix): boolean {
	return !matrix || matrix.every((value, i) => value === IDENTITY_MATRIX[i]);
}

export function isIdentity(correction: SpatialCorrection): boolean {
	if (correction.useMatrix) return isIdentityMatrix(correction.matrix);
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
	if (correction.useMatrix) {
		const m = correction.matrix ?? IDENTITY_MATRIX;
		const w = m[12] * x + m[13] * y + m[15];
		if (w === 0) return { x, y };
		return {
			x: (m[0] * x + m[1] * y + m[3]) / w,
			y: (m[4] * x + m[5] * y + m[7]) / w
		};
	}
	return {
		x: (x - correction.centerX) * correction.scaleX + correction.centerX + correction.offsetX,
		y: (y - correction.centerY) * correction.scaleY + correction.centerY + correction.offsetY
	};
}

/** Inverts the affine part only; matrix mode is not supported. */
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
