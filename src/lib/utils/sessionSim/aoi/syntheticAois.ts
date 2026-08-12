import type { AoiRect } from '../types';

/**
 * The live task stage registers both dwell targets as intersect/fixation AOIs,
 * but screenshot mode never mounts them, so their static TrackLevel.svelte
 * geometry is synthesized here. DwellTarget height defaults to width * 0.6,
 * so both are 125x75 with buffer 50: the advance arrow at bottom-16/right-16,
 * the initial dwell eye at top-16/left-16. Each is only mounted during part of
 * the slide live (eye before dwell-finish, arrow after), which replay
 * approximates by keeping both present for the whole window.
 */
const DWELL_WIDTH = 125;
const DWELL_HEIGHT = 75;
const DWELL_MARGIN = 64;
const DWELL_BUFFER = 50;

export function synthesizeDwellArrowAoi(
	viewport: { width: number; height: number },
	slideIndex: number
): AoiRect {
	return {
		id: `slide-${slideIndex}_end`,
		left: viewport.width - DWELL_MARGIN - DWELL_WIDTH,
		top: viewport.height - DWELL_MARGIN - DWELL_HEIGHT,
		right: viewport.width - DWELL_MARGIN,
		bottom: viewport.height - DWELL_MARGIN,
		bufferSize: DWELL_BUFFER,
		synthetic: true
	};
}

export function synthesizeDwellEyeAoi(slideIndex: number): AoiRect {
	return {
		id: `slide-${slideIndex}_initial`,
		left: DWELL_MARGIN,
		top: DWELL_MARGIN,
		right: DWELL_MARGIN + DWELL_WIDTH,
		bottom: DWELL_MARGIN + DWELL_HEIGHT,
		bufferSize: DWELL_BUFFER,
		synthetic: true
	};
}
