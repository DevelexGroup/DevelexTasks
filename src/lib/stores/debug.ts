import { writable } from 'svelte/store';

export const debugWindowOpenKey = 'F9';
export const debugWindowVisible = writable<boolean>(false);
export const debugMode = writable<boolean>(false);

// Single debug options in one store
export interface DebugOptions {
	debugAOIAreaVisible: boolean;
	debugAOIBufferSize: number;
}

export const debugOptions = writable<DebugOptions>({
	debugAOIAreaVisible: true,
	debugAOIBufferSize: 50
});