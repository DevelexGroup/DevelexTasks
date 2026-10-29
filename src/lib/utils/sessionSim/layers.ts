import type { PointMapper } from '$lib/utils/postProcessing/outputs';
import { applyCorrection, correctionsEqual, invertCorrection, isIdentity } from './transform';
import type { SpatialCorrection } from './types';

/** A session's full correction state at one moment. */
export interface CorrectionSnapshot {
	sessionCorrection: SpatialCorrection;
	slideOverrides: Record<number, SpatialCorrection>;
}

export function correctionForSlide(snapshot: CorrectionSnapshot, slide: number): SpatialCorrection {
	return snapshot.slideOverrides[slide] ?? snapshot.sessionCorrection;
}

/**
 * Maps points computed under `computed` (null = uncorrected data) to where
 * `current` puts them: current ∘ computed⁻¹. Null for slides where both agree.
 */
export function shiftMapper(
	current: CorrectionSnapshot,
	computed: CorrectionSnapshot | null
): (slide: number) => PointMapper | null {
	return (slide) => {
		const target = correctionForSlide(current, slide);
		const source = computed ? correctionForSlide(computed, slide) : null;
		if (!source || isIdentity(source)) {
			return isIdentity(target) ? null : (x, y) => applyCorrection(x, y, target);
		}
		if (correctionsEqual(source, target)) return null;
		return (x, y) => {
			const uncorrected = invertCorrection(x, y, source);
			return uncorrected ? applyCorrection(uncorrected.x, uncorrected.y, target) : { x, y };
		};
	};
}
