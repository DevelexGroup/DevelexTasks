import type { GazeInteractionObjectSaccadeEvent } from 'develex-js-sdk';

export type Saccade = Omit<GazeInteractionObjectSaccadeEvent, 'target' | 'settings'> & {
	aoi: string; // stringified Array of AOI labels, split by ';' (e.g. 'AOI1;AOI2')
	id?: number;
};
