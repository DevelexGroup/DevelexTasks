import type { GazeInteractionObjectDwellEvent } from '@473783/develex-core';

export type Dwell = Omit<GazeInteractionObjectDwellEvent, 'target' | 'settings'> & {
	aoi: string; // stringified Array of AOI labels, split by ';' (e.g. 'AOI1;AOI2')
	id?: number;
};
