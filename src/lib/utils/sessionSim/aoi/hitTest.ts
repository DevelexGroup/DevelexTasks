import type { AoiRect } from '../types';

/** Mirror of the SDK's isPointInside: inclusive bounds, rect inflated by bufferSize. */
export function hitTest(x: number, y: number, rect: AoiRect): boolean {
	return (
		x >= rect.left - rect.bufferSize &&
		x <= rect.right + rect.bufferSize &&
		y >= rect.top - rect.bufferSize &&
		y <= rect.bottom + rect.bufferSize
	);
}

export function hitTestAll(x: number, y: number, aois: AoiRect[]): string[] {
	const hits: string[] = [];
	for (const rect of aois) {
		if (hitTest(x, y, rect)) hits.push(rect.id);
	}
	return hits;
}
