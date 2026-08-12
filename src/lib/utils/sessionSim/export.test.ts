import { describe, expect, it } from 'vitest';
import { buildCorrectedFiles, buildCorrectedZip, correctedZipName } from './export';
import { classifyFileName, loadFromZip } from './loaders';
import { runReplay } from './replay';
import { identityCorrection } from './transform';
import {
	DEFAULT_DETECTOR_PARAMS,
	DEFAULT_GAP_RESET_MS,
	defaultReplayOptions,
	type LoadedSession,
	type ReplayResult
} from './types';
import type { GazeSampleDataEntry, RawGazeDataEntry } from '$lib/database/db.types';

const BASE_MS = Date.parse('2024-08-11T12:00:00.000Z');
const SESSION_ID = String(BASE_MS);

function buildSession(): LoadedSession {
	const rawGazeData: RawGazeDataEntry[] = [];
	const gazeSamples: GazeSampleDataEntry[] = [];
	for (let t = 0; t <= 400; t += 10) {
		const iso = new Date(BASE_MS + t).toISOString();
		rawGazeData.push({
			child_id: 'child',
			session_id: SESSION_ID,
			task_name: 'cibule-1',
			slide_index: 1,
			timestamp: BASE_MS + t,
			bridgeTimeStamp: iso,
			deviceTimeStamp: iso,
			x: 100,
			y: 100,
			xL: 100,
			yL: 100,
			validityL: true,
			pupilDiameterL: 3,
			xR: 100,
			yR: 100,
			validityR: true,
			pupilDiameterR: 3
		});
		gazeSamples.push({
			child_id: 'child',
			session_id: SESSION_ID,
			task_name: 'cibule-1',
			slide_index: 1,
			stimulus_id: '5',
			timestamp: BASE_MS + t,
			device_timestamp: iso,
			eyetracker_x: 100,
			eyetracker_y: 100,
			aoi: [],
			mouse_x: 0,
			mouse_y: 0,
			events: t === 0 ? ['dwell-finish_slide-1_initial'] : t === 400 ? ['complete-slide-1'] : [],
			sound_name: [],
			mistake_type: [],
			task_result: null
		});
	}
	return {
		childId: 'child',
		sessionId: SESSION_ID,
		taskName: 'cibule-1',
		gazeSamples,
		fixationData: [],
		sessionScores: [],
		rawGazeData,
		maxSlides: 1,
		warnings: []
	};
}

function buildResult(session: LoadedSession): ReplayResult {
	return runReplay({
		session,
		corrections: { sessionDefault: identityCorrection(), perSlide: new Map() },
		geometryBySlide: new Map(),
		options: defaultReplayOptions()
	});
}

function meta(session: LoadedSession) {
	return {
		session,
		viewport: { width: 1920, height: 1080 },
		sessionCorrection: identityCorrection(960, 540),
		slideOverrides: {},
		detectorParams: { ...DEFAULT_DETECTOR_PARAMS },
		aoiAttribution: 'snapshot-at-start' as const,
		dropUnfinishedFinalFixation: true,
		countFixationsOpenAtWindowEnd: false,
		gapResetMs: DEFAULT_GAP_RESET_MS,
		dropColdStartFixation: false,
		rebaseRawTimestamps: false,
		synthesizeDwellArrow: true,
		synthesizeDwellEye: true
	};
}

describe('buildCorrectedFiles', () => {
	it('produces re-importable CSVs and a parseable corrections.json', () => {
		const session = buildSession();
		const files = buildCorrectedFiles(buildResult(session), meta(session));

		expect(files.map((f) => f.name)).toEqual([
			'gazeSamples_corrected.csv',
			'fixationData_corrected.csv',
			'sessionScores_corrected.csv',
			'rawGazeData_corrected.csv',
			'corrections.json'
		]);

		// Each CSV name routes back to its table in the file-drop loader
		expect(classifyFileName(files[0].name)).toBe('gazeSamples');
		expect(classifyFileName(files[1].name)).toBe('fixationData');
		expect(classifyFileName(files[2].name)).toBe('sessionScores');
		expect(classifyFileName(files[3].name)).toBe('rawGazeData');
		expect(classifyFileName(files[4].name)).toBeNull();

		const corrections = JSON.parse(files[4].content);
		expect(corrections.source.sessionId).toBe(SESSION_ID);
		expect(corrections.viewport).toEqual({ width: 1920, height: 1080 });
		expect(corrections.detectorParams).toEqual(DEFAULT_DETECTOR_PARAMS);
	});
});

describe('buildCorrectedZip', () => {
	it('round-trips through the file-drop loader', async () => {
		const session = buildSession();
		const result = buildResult(session);
		const blob = await buildCorrectedZip(result, meta(session));

		const reimported = await loadFromZip(await blob.arrayBuffer());
		expect(reimported.sessionId).toBe(SESSION_ID);
		expect(reimported.taskName).toBe('cibule-1');
		expect(reimported.rawGazeData).toHaveLength(session.rawGazeData.length);
		expect(reimported.gazeSamples).toHaveLength(session.gazeSamples.length);
		expect(reimported.fixationData).toHaveLength(result.fixations.length);
	});
});

describe('correctedZipName', () => {
	it('stamps child, task and session date with a corrected marker', () => {
		expect(correctedZipName(buildSession())).toBe(
			'session-sim_child_cibule-1_2024-08-11_12-00-00_corrected.zip'
		);
	});
});
