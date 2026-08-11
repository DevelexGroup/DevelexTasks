import type { AoiRect } from '$lib/utils/sessionSim/types';

/**
 * Reads AOI rects of all mounted GazeArea elements inside the stage, converted
 * back to virtual-viewport pixels (the stage renders scaled by `fit`).
 */
export function captureAoiRects(stageNode: HTMLElement, fit: number): AoiRect[] {
	const stageRect = stageNode.getBoundingClientRect();
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
