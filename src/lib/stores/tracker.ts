import { dev } from '$app/environment';
import type { GazeInputConfigWithFixations } from 'develex-js-sdk';
import { session } from '../utils/persistedStore';

export enum AvaiableTracker {
	GazePointBase = 'gazepoint_base',
	GazePointIdt = 'gazepoint_idt',
	EyeLogicIdt = 'eyelogic_idt',
	MockBase = 'mock_base',
	MouseIdt = 'mouse_idt'
}

export type TrackerConfig = GazeInputConfigWithFixations & {
	developmentOnly?: boolean;
}

export const GAZE_INPUT_CONFIGS: Record<AvaiableTracker, TrackerConfig> = {
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
	mock_base: {
		tracker: 'mock',
		uri: 'ws://localhost:13892',
		fixationDetection: 'device',
		developmentOnly: true
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

export const SELECTABLE_GAZE_INPUT_CONFIGS = Object.fromEntries(
	Object.entries(GAZE_INPUT_CONFIGS).filter(([, config]) => dev || !config.developmentOnly)
) as Record<string, TrackerConfig>;

export const trackerConfig = session<AvaiableTracker>('tracker_config', AvaiableTracker.MouseIdt);
