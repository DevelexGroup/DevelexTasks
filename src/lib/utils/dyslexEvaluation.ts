import type {
	DyslexEvaluationStatus,
	DyslexPreprocessingSettings,
	DyslexTaskKey
} from '$lib/api/dyslex-evaluations';

export const DYSLEX_TASK_KEYS: DyslexTaskKey[] = ['syllables', 'meantext', 'pseudotext', 'visdiff'];

export const ACTIVE_DYSLEX_STATUSES: DyslexEvaluationStatus[] = [
	'SUBMITTING',
	'QUEUED',
	'PROCESSING',
	'CLASSIFYING'
];

export const DEFAULT_DYSLEX_SETTINGS: DyslexPreprocessingSettings = {
	frequencyHz: 120,
	screenWidthCm: 53.13,
	screenHeightCm: 29.89,
	screenDistanceCm: 65,
	screenWidthPx: 1920,
	screenHeightPx: 1080
};

export const areDyslexSettingsValid = (settings: DyslexPreprocessingSettings): boolean =>
	Number.isInteger(settings.frequencyHz) &&
	settings.frequencyHz > 0 &&
	settings.frequencyHz % 10 === 0 &&
	Number.isFinite(settings.screenWidthCm) &&
	settings.screenWidthCm > 0 &&
	Number.isFinite(settings.screenHeightCm) &&
	settings.screenHeightCm > 0 &&
	Number.isFinite(settings.screenDistanceCm) &&
	settings.screenDistanceCm > 0 &&
	Number.isInteger(settings.screenWidthPx) &&
	settings.screenWidthPx > 0 &&
	Number.isInteger(settings.screenHeightPx) &&
	settings.screenHeightPx > 0;

export const isDyslexEvaluationActive = (status: DyslexEvaluationStatus): boolean =>
	ACTIVE_DYSLEX_STATUSES.includes(status);
