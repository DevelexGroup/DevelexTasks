import type { AoiRect } from '$lib/utils/sessionSim/types';

/**
 * Reads AOI rects of all mounted GazeArea elements inside the stage, converted
 * back to virtual-viewport pixels. The visual scale (fit × zoom) is derived
 * from the node itself, so capture works regardless of the current view.
 */
export function captureAoiRects(stageNode: HTMLElement): AoiRect[] {
	const stageRect = stageNode.getBoundingClientRect();
	const fit = stageNode.offsetWidth > 0 ? stageRect.width / stageNode.offsetWidth : 1;
	const rects: AoiRect[] = [];

	for (const element of stageNode.querySelectorAll<HTMLElement>('.gaze-area')) {
		if (!element.id) continue;
		const rect = element.getBoundingClientRect();
		const bufferSize =
			parseFloat(element.dataset.aoiBuffer ?? element.style.getPropertyValue('--buffer-size')) || 0;

		rects.push({
			id: element.id,
			left: (rect.left - stageRect.left) / fit,
			top: (rect.top - stageRect.top) / fit,
			right: (rect.right - stageRect.left) / fit,
			bottom: (rect.bottom - stageRect.top) / fit,
			bufferSize
		});
	}

	return rects;
}
