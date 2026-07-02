export enum LoadState {
	Loading,
	Loaded,
	Error,
	Skipped
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

/**
 * Context key set by the admin stimulus-export tool. When present, task components
 * render a single stimulus for screenshotting: no dwell targets, no gaze registration,
 * no audio, no transitions, and viewport dimensions come from the context instead of
 * the real window. Absent (undefined) during normal task runs.
 */
export const SCREENSHOT_MODE_KEY = 'screenshotMode';

export interface ScreenshotModeContext {
	viewport: { width: number; height: number };
	highlightTargets: boolean;
}
