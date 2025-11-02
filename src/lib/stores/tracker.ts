import type { GazeInputConfig, GazeInputConfigWithFixations } from 'develex-js-sdk';
import { writable } from 'svelte/store';

export const GAZEPOINT_BASE: GazeInputConfig = {
	tracker: 'gazepoint',
	uri: 'ws://localhost:13892',
	fixationDetection: 'device'
};

export const GAZEPOINT_IDT: GazeInputConfig = {
	tracker: 'gazepoint',
	uri: 'ws://localhost:13892',
	fixationDetection: 'idt'
};

export const MOUSE_IDT: GazeInputConfig = {
	tracker: 'dummy',
	fixationDetection: 'idt',
	frequency: 60,
	precisionMinimalError: 0.5,
	precisionDecayRate: 0.1,
	precisionMaximumError: 1.5
};

export const EYELOGIC_IDT: GazeInputConfig = {
	tracker: 'eyelogic',
	uri: 'ws://localhost:13892',
	fixationDetection: 'idt'
};

export const trackerConfig = writable<GazeInputConfigWithFixations>(MOUSE_IDT);
