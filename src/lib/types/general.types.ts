export enum LoadState {
	Loading,
	Loaded,
	Error
}

export enum DwellState {
	Active,
	Disabled,
	ActiveDwelling,
	DwellCancelled
}

export const GAZE_MANAGER_KEY = 'gazeManager';
export const KEYBOARD_MANAGER_KEY = 'keyboardManager';
export const ANALYTICS_MANAGER_KEY = 'analyticsManager';