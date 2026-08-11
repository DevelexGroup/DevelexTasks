import type { AoiRect } from '../types';

/**
 * The live task stage also registers the advance dwell arrow as an intersect
 * AOI, but screenshot mode never mounts it. Its geometry is static:
 * 125x125 at bottom-16/right-16, buffer 50 (TrackLevel.svelte). The initial
 * dwell target is not synthesized — it is unmounted during the slide's
 * effective time window.
 */
export function synthesizeDwellArrowAoi(
	viewport: { width: number; height: number },
	slideIndex: number
): AoiRect {
	const SIZE = 125;
	const MARGIN = 64;
	return {
		id: `slide-${slideIndex}_end`,
		left: viewport.width - MARGIN - SIZE,
		top: viewport.height - MARGIN - SIZE,
		right: viewport.width - MARGIN,
		bottom: viewport.height - MARGIN,
		bufferSize: 50,
		synthetic: true
	};
}
