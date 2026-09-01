import type { GazeSampleDataEntry } from '$lib/database/db.types';
import { synthesizeDwellArrowAoi, synthesizeDwellEyeAoi } from './aoi/syntheticAois';
import type { AoiRect, SlideCorrectionMap, SlideGeometry, SpatialCorrection } from './types';

export function distinctSlides(gazeSamples: GazeSampleDataEntry[]): number[] {
	return [...new Set(gazeSamples.map((row) => row.slide_index))]
		.filter((slide) => slide >= 0)
		.sort((a, b) => a - b);
}

export function buildGeometryMap(
	capturedAois: Record<number, AoiRect[]>,
	stimulusBySlide: Record<number, string>,
	viewport: { width: number; height: number },
	synthesize: { dwellArrow: boolean; dwellEye: boolean }
): Map<number, SlideGeometry> {
	const map = new Map<number, SlideGeometry>();
	for (const [slideKey, aois] of Object.entries(capturedAois)) {
		const slide = Number(slideKey);
		const combined = [...aois];
		// Recorded geometry already contains the real dwell AOIs
		const ids = new Set(aois.map((aoi) => aoi.id));
		if (synthesize.dwellArrow && !ids.has(`slide-${slide}_end`))
			combined.push(synthesizeDwellArrowAoi(viewport, slide));
		if (synthesize.dwellEye && !ids.has(`slide-${slide}_initial`))
			combined.push(synthesizeDwellEyeAoi(slide));
		map.set(slide, {
			slideIndex: slide,
			stimulusId: stimulusBySlide[slide] ?? 'null',
			aois: combined,
			viewport,
			approximate: false
		});
	}
	return map;
}

export function buildCorrections(
	sessionDefault: SpatialCorrection,
	overrides: Record<number, SpatialCorrection>
): SlideCorrectionMap {
	return {
		sessionDefault: { ...sessionDefault },
		perSlide: new Map(
			Object.entries(overrides).map(([slide, correction]) => [Number(slide), { ...correction }])
		)
	};
}
