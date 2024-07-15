import { type GazeInputConfigWithFixations } from '@473783/develex-core';
import { writable, type Writable } from 'svelte/store';

export const inputCreationConfig: Writable<GazeInputConfigWithFixations> = writable({
	tracker: 'opengaze',
	uri: 'ws://localhost:13892',
	fixationDetection: 'device'
});

interface ConfigMouseEventFields {
	clientX: number;
	clientY: number;
	screenX: number;
	screenY: number;
}

interface ConfigWindowFields {
	screen: {
		width: number;
		height: number;
	};
}

interface ConfigWindowCalibrationFields {
	mouse: ConfigMouseEventFields;
	window: ConfigWindowFields;
}

/**
 * The gaze input store.
 */
export const inputWindowFieldsConfig = writable<ConfigWindowCalibrationFields | null>(null);

export const setConfigWindowFields = (
	mouse: ConfigMouseEventFields,
	window: ConfigWindowFields
) => {
	inputWindowFieldsConfig.set({ mouse, window });
};
