import { type GazeInputConfigWithFixations } from '@473783/develex-core';
import { writable, type Writable } from 'svelte/store';

export const inputCreationConfig: Writable<GazeInputConfigWithFixations> = writable({
	tracker: 'gazepoint',
	uri: 'ws://localhost:13892',
	fixationDetection: 'device'
});
