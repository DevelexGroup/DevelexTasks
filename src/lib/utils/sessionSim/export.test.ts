import { describe, expect, it } from 'vitest';
import {
	buildCorrectedFiles,
	buildCorrectedZip,
	buildUnifiedExportFiles,
	correctedZipName
} from './export';
import { classifyFileName, loadSessionsFromZip, sessionFolderOf } from './loaders';
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

function buildSession(overrides: Partial<LoadedSession> = {}): LoadedSession {
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
		i2mcFixationData: [],
		sessionScores: [],
		rawGazeData,
		recordedGeometry: [],
		meta: null,
		metaRaw: null,
		bridgeStamped: false,
		exportFolder: 'child/2024-08-11_14-00-00_cibule-1',
		warnings: [],
		...overrides
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
	it('lays the session out like the server export with original file names', () => {
		const session = buildSession();
		const files = buildCorrectedFiles(buildResult(session), meta(session));

		// No fixation survived the replay, so like the live upload there is no fixationData file
		expect(files.map((f) => f.name)).toEqual([
			'part_1/gazeSamples_slide1.csv',
			'part_1/sessionScores_slide1.csv',
			'part_1/rawGazeData_slide1.csv',
			'meta/corrections.json'
		]);

		// Each CSV routes back to its table and session folder in the loader
		const baseName = (path: string) => path.split('/').pop() ?? path;
		expect(classifyFileName(baseName(files[0].name))).toBe('gazeSamples');
		expect(classifyFileName(baseName(files[1].name))).toBe('sessionScores');
		expect(classifyFileName(baseName(files[2].name))).toBe('rawGazeData');
		expect(classifyFileName(baseName(files[3].name))).toBeNull();
		expect(files.every((f) => sessionFolderOf(f.name) === '')).toBe(true);

		const corrections = JSON.parse(files[3].content);
		expect(corrections.source.sessionId).toBe(SESSION_ID);
		expect(corrections.viewport).toEqual({ width: 1920, height: 1080 });
		expect(corrections.detectorParams).toEqual(DEFAULT_DETECTOR_PARAMS);
	});

	it('splits every table by slide into its part folder', () => {
		const session = buildSession();
		const result = buildResult(session);
		result.rawGazeData = result.rawGazeData.map((row, i) => ({
			...row,
			slide_index: i % 2 === 0 ? 1 : 3
		}));

		const names = buildCorrectedFiles(result, meta(session)).map((f) => f.name);
		expect(names).toContain('part_1/rawGazeData_slide1.csv');
		expect(names).toContain('part_3/rawGazeData_slide3.csv');
		expect(names.filter((n) => n.includes('gazeSamples'))).toEqual([
			'part_1/gazeSamples_slide1.csv'
		]);
	});

	it('carries recorded geometry and meta.json through unchanged', () => {
		const session = buildSession({
			recordedGeometry: [
				{
					slideIndex: 1,
					stimulusId: '5',
					viewport: { width: 1920, height: 1080 },
					aois: [{ id: 'track', left: 0, top: 0, right: 100, bottom: 100, bufferSize: 50 }]
				}
			],
			metaRaw: '{"metaVersion":1}'
		});

		const files = buildCorrectedFiles(buildResult(session), meta(session));
		expect(files.map((f) => f.name).slice(0, 2)).toEqual([
			'meta/meta.json',
			'part_1/aoiGeometry_slide1.json'
		]);
		expect(files[0].content).toBe('{"metaVersion":1}');
	});
});

describe('buildUnifiedExportFiles', () => {
	it('prefixes each session with its folder and suffixes repeated folders', () => {
		const a = buildSession();
		const b = buildSession({
			childId: 'other',
			exportFolder: 'other/2024-08-11_14-00-00_cibule-1'
		});
		const c = buildSession();
		const files = buildUnifiedExportFiles([
			{ result: buildResult(a), meta: meta(a) },
			{ result: buildResult(b), meta: meta(b) },
			{ result: buildResult(c), meta: meta(c) }
		]);

		const folders = [...new Set(files.map((f) => sessionFolderOf(f.name)))];
		expect(folders).toEqual([
			'child/2024-08-11_14-00-00_cibule-1',
			'other/2024-08-11_14-00-00_cibule-1',
			'child/2024-08-11_14-00-00_cibule-1_2'
		]);
		expect(files.map((f) => f.name)).toContain(
			'child/2024-08-11_14-00-00_cibule-1/part_1/rawGazeData_slide1.csv'
		);
	});
});

describe('buildCorrectedZip', () => {
	it('round-trips every session through the file-drop loader', async () => {
		const a = buildSession();
		const b = buildSession({
			childId: 'other',
			exportFolder: 'other/2024-08-11_14-00-00_cibule-1',
			rawGazeData: buildSession().rawGazeData.map((row) => ({ ...row, child_id: 'other' })),
			gazeSamples: buildSession().gazeSamples.map((row) => ({ ...row, child_id: 'other' }))
		});
		const resultA = buildResult(a);
		const blob = await buildCorrectedZip([
			{ result: resultA, meta: meta(a) },
			{ result: buildResult(b), meta: meta(b) }
		]);

		const reimported = await loadSessionsFromZip(await blob.arrayBuffer());
		expect(reimported.map((s) => s.exportFolder)).toEqual([a.exportFolder, b.exportFolder]);
		expect(reimported[0].sessionId).toBe(SESSION_ID);
		expect(reimported[0].taskName).toBe('cibule-1');
		expect(reimported[0].rawGazeData).toHaveLength(a.rawGazeData.length);
		expect(reimported[0].gazeSamples).toHaveLength(a.gazeSamples.length);
		expect(reimported[0].fixationData).toHaveLength(resultA.fixations.length);
		expect(reimported[1].childId).toBe('other');
	});
});

describe('correctedZipName', () => {
	it('stamps child, task and session date with a corrected marker', () => {
		expect(correctedZipName([buildSession()])).toBe(
			'session-sim_child_cibule-1_2024-08-11_12-00-00_corrected.zip'
		);
	});

	it('names a batch export generically', () => {
		expect(correctedZipName([buildSession(), buildSession()])).toMatch(
			/^session-sim_export_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_corrected\.zip$/
		);
	});
});
