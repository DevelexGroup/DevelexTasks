import type { GazeSampleDataEntry } from '$lib/database/db.types';
import { synthesizeDwellArrowAoi } from './aoi/syntheticAois';
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
	synthesizeDwellArrow: boolean
): Map<number, SlideGeometry> {
	const map = new Map<number, SlideGeometry>();
	for (const [slideKey, aois] of Object.entries(capturedAois)) {
		const slide = Number(slideKey);
		map.set(slide, {
			slideIndex: slide,
			stimulusId: stimulusBySlide[slide] ?? 'null',
			aois: synthesizeDwellArrow ? [...aois, synthesizeDwellArrowAoi(viewport, slide)] : [...aois],
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
