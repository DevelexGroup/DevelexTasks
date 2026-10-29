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

/** Inverse of applyCorrection; null when the correction is singular. */
export function invertCorrection(
	x: number,
	y: number,
	correction: SpatialCorrection
): { x: number; y: number } | null {
	if (correction.useMatrix) {
		const m = correction.matrix ?? IDENTITY_MATRIX;
		// The 3×3 projective map the 4×4 applies to (x, y, 0, 1)
		const [a, b, c, d, e, f, g, h, i] = [m[0], m[1], m[3], m[4], m[5], m[7], m[12], m[13], m[15]];
		const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
		if (det === 0) return null;
		const px = (e * i - f * h) * x + (c * h - b * i) * y + (b * f - c * e);
		const py = (f * g - d * i) * x + (a * i - c * g) * y + (c * d - a * f);
		const w = (d * h - e * g) * x + (b * g - a * h) * y + (a * e - b * d);
		if (w === 0) return null;
		return { x: px / w, y: py / w };
	}
	if (correction.scaleX === 0 || correction.scaleY === 0) return null;
	return {
		x: (x - correction.centerX - correction.offsetX) / correction.scaleX + correction.centerX,
		y: (y - correction.centerY - correction.offsetY) / correction.scaleY + correction.centerY
	};
}

/** True when both corrections map every point identically. */
export function correctionsEqual(a: SpatialCorrection, b: SpatialCorrection): boolean {
	if (isIdentity(a) && isIdentity(b)) return true;
	if (!!a.useMatrix !== !!b.useMatrix) return false;
	if (a.useMatrix) {
		const am = a.matrix ?? IDENTITY_MATRIX;
		const bm = b.matrix ?? IDENTITY_MATRIX;
		return am.every((value, i) => value === bm[i]);
	}
	return (
		a.offsetX === b.offsetX &&
		a.offsetY === b.offsetY &&
		a.scaleX === b.scaleX &&
		a.scaleY === b.scaleY &&
		((a.scaleX === 1 && a.scaleY === 1) || (a.centerX === b.centerX && a.centerY === b.centerY))
	);
}
