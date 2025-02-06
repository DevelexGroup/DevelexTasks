import { type GazeInputConfigWithFixations } from '@473783/develex-core';
import { writable, type Writable } from 'svelte/store';

export const inputCreationConfig: Writable<GazeInputConfigWithFixations> = writable({
	tracker: 'dummy',
	fixationDetection: 'idt',
	frequency: 60,
	precisionMinimalError: 0.5,
	precisionDecayRate: 0.1,
	precisionMaximumError: 1.5
});
