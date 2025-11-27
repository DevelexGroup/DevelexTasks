import type { GazeInputConfigWithFixations } from 'develex-js-sdk';
import { writable } from 'svelte/store';

export enum AvaiableTracker {
	GazePointBase = 'gazepoint_base',
	GazePointIdt = 'gazepoint_idt',
	EyeLogicIdt = 'eyelogic_idt',
	MouseIdt = 'mouse_idt'
}

export const GAZE_INPUT_CONFIGS: Record<AvaiableTracker, GazeInputConfigWithFixations> = {
	gazepoint_base: {
		tracker: 'gazepoint',
		uri: 'ws://localhost:13892',
		fixationDetection: 'device'
	},
	gazepoint_idt: {
		tracker: 'gazepoint',
		uri: 'ws://localhost:13892',
		fixationDetection: 'idt'
	},
	eyelogic_idt: {
		tracker: 'eyelogic',
		uri: 'ws://localhost:13892',
		fixationDetection: 'idt'
	},
	mouse_idt: {
		tracker: 'dummy',
		fixationDetection: 'idt',
		frequency: 60,
		precisionMinimalError: 0.5,
		precisionDecayRate: 0.1,
		precisionMaximumError: 1.5
	}
};

export const trackerConfig = writable<AvaiableTracker>(AvaiableTracker.MouseIdt);
