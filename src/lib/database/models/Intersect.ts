import type { GazeInteractionObjectIntersectEvent } from '@473783/develex-core';

export type Intersect = Omit<GazeInteractionObjectIntersectEvent, 'target' | 'settings'> & {
	aoi: string; // stringified Array of AOI labels, split by ';' (e.g. 'AOI1;AOI2')
	id?: number;
};
