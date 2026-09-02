import { describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import type { GazeSampleDataEntry, RawGazeDataEntry } from '$lib/database/db.types';
import { DatabaseExporter } from '$lib/utils/databaseExport';
import {
	classifyFileName,
	loadRemoteSession,
	loadSessionsFromFiles,
	loadSessionsFromZip,
	sessionExportFolder,
	sessionFolderOf,
	sessionFolderStamp
} from './loaders';
import { downloadTestSessionFile, getTestSessionDetail } from '$lib/api/test-sessions';

vi.mock('$lib/api/test-sessions', () => ({
	getTestSessionDetail: vi.fn(),
	downloadTestSessionFile: vi.fn()
}));

const SESSION_ID = '1723380000000';

function rawEntry(overrides: Partial<RawGazeDataEntry> = {}): RawGazeDataEntry {
	return {
		child_id: 'child',
		session_id: SESSION_ID,
		task_name: 'cibule-1',
		slide_index: 1,
		timestamp: 1723380000100,
		bridgeTimeStamp: '2024-08-11T12:00:00.100Z',
		deviceTimeStamp: '2024-08-11T12:00:00.099Z',
		x: 100,
		y: 200,
		xL: 100,
		yL: 200,
		validityL: true,
		pupilDiameterL: 3,
		xR: 100,
		yR: 200,
		validityR: true,
		pupilDiameterR: 3,
		...overrides
	};
}

function sampleEntry(overrides: Partial<GazeSampleDataEntry> = {}): GazeSampleDataEntry {
	return {
		child_id: 'child',
		session_id: SESSION_ID,
		task_name: 'cibule-1',
		slide_index: 2,
		stimulus_id: '5',
		timestamp: 1723380000100,
		device_timestamp: '2024-08-11T12:00:00.099Z',
		eyetracker_x: 10,
		eyetracker_y: 20,
		aoi: [],
		mouse_x: 0,
		mouse_y: 0,
		events: [],
		sound_name: [],
		mistake_type: [],
		task_result: null,
		...overrides
	};
}

function buildCsvs() {
	return {
		rawCsv: DatabaseExporter.createCsvContent(
			[rawEntry({ timestamp: 1723380000200 }), rawEntry({ timestamp: 1723380000100 })],
			'rawGazeData'
		),
		samplesCsv: DatabaseExporter.createCsvContent([sampleEntry()], 'gazeSamples')
	};
}

function textFile(name: string, content: string) {
	return { name, text: () => Promise.resolve(content) };
}

async function loadSingle(files: { name: string; text(): Promise<string> }[]) {
	const sessions = await loadSessionsFromFiles(files);
	expect(sessions).toHaveLength(1);
	return sessions[0];
}

describe('classifyFileName', () => {
	it('routes table files and ignores the rest', () => {
		expect(classifyFileName('rawGazeData_slide1.csv')).toBe('rawGazeData');
		expect(classifyFileName('gazeSamples_slide2.csv')).toBe('gazeSamples');
		expect(classifyFileName('fixationData.csv')).toBe('fixationData');
		expect(classifyFileName('sessionScores.csv')).toBe('sessionScores');
		expect(classifyFileName('clientLogs.log')).toBeNull();
	});

	it('separates I2MC fixation files from ICT fixationData', () => {
		expect(classifyFileName('I2MC_fixationData_slide1.csv')).toBe('i2mcFixationData');
		expect(classifyFileName('I2MC_fixationData.csv')).toBe('i2mcFixationData');
		expect(classifyFileName('i2mc_notes.csv')).toBeNull();
	});

	it('routes recorded AOI geometry files', () => {
		expect(classifyFileName('aoiGeometry_slide3.json')).toBe('aoiGeometry');
	});

	it('routes the session meta file by exact name', () => {
		expect(classifyFileName('meta.json')).toBe('sessionMeta');
		expect(classifyFileName('somethingmeta.json')).toBeNull();
	});

	it('ignores backup copies of replaced files', () => {
		expect(classifyFileName('backup_20260902-101530_meta.json')).toBeNull();
		expect(classifyFileName('backup_20260902-101530_I2MC_fixationData_slide1.csv')).toBeNull();
		expect(classifyFileName('backup_20260902-101530_aoiGeometry_slide1.json')).toBeNull();
	});
});

describe('session folders', () => {
	it('strips the file name and the server part folder', () => {
		expect(sessionFolderOf('anna/2026-09-01_10-15-30_cibule-1/part_3/rawGazeData_slide3.csv')).toBe(
			'anna/2026-09-01_10-15-30_cibule-1'
		);
		expect(sessionFolderOf('anna/2026-09-01_10-15-30_cibule-1/meta/meta.json')).toBe(
			'anna/2026-09-01_10-15-30_cibule-1'
		);
		expect(sessionFolderOf('part_2/gazeSamples_slide2.csv')).toBe('');
		expect(sessionFolderOf('gazeSamples_corrected.csv')).toBe('');
		expect(sessionFolderOf('child/2024-08-11_cibule-1/gazeSamples.csv')).toBe(
			'child/2024-08-11_cibule-1'
		);
	});

	it('stamps session folders in local time like the server', () => {
		const date = new Date(2026, 8, 1, 10, 15, 30);
		expect(sessionFolderStamp(date)).toBe('2026-09-01_10-15-30');
		expect(sessionExportFolder('anna', date, 'cibule-1')).toBe('anna/2026-09-01_10-15-30_cibule-1');
	});
});

describe('loadSessionsFromFiles', () => {
	it('assembles a session from loose CSVs, sorted and with derived identity', async () => {
		const { rawCsv, samplesCsv } = buildCsvs();
		const session = await loadSingle([
			textFile('rawGazeData_slide1.csv', rawCsv),
			textFile('gazeSamples_slide2.csv', samplesCsv),
			textFile('clientLogs.log', 'noise')
		]);

		expect(session.childId).toBe('child');
		expect(session.sessionId).toBe(SESSION_ID);
		expect(session.taskName).toBe('cibule-1');
		expect(session.rawGazeData).toHaveLength(2);
		expect(session.rawGazeData[0].timestamp).toBeLessThan(session.rawGazeData[1].timestamp);
		expect(session.gazeSamples).toHaveLength(1);
		expect(session.warnings).toEqual([]);
		expect(session.exportFolder).toBe(
			`child/${sessionFolderStamp(new Date(Number(SESSION_ID)))}_cibule-1`
		);
	});

	it('splits loose files holding several sessions by their row identity', async () => {
		const rawA = DatabaseExporter.createCsvContent([rawEntry()], 'rawGazeData');
		const rawB = DatabaseExporter.createCsvContent(
			[rawEntry({ child_id: 'other', session_id: '1723390000000', task_name: 'slabiky-2' })],
			'rawGazeData'
		);
		const sessions = await loadSessionsFromFiles([
			textFile('rawGazeData_a.csv', rawA),
			textFile('rawGazeData_b.csv', rawB),
			textFile('meta.json', JSON.stringify({ metaVersion: 1, session: {} }))
		]);

		expect(sessions.map((s) => s.childId).sort()).toEqual(['child', 'other']);
		// meta.json can't be attributed when the folder holds two sessions
		expect(sessions.every((s) => s.meta === null)).toBe(true);
		expect(sessions.every((s) => s.warnings.some((w) => w.includes('nelze přiřadit')))).toBe(true);
	});

	it('warns when raw gaze data is missing', async () => {
		const { samplesCsv } = buildCsvs();
		const session = await loadSingle([textFile('gazeSamples_slide2.csv', samplesCsv)]);
		expect(session.warnings.some((w) => w.includes('rawGazeData'))).toBe(true);
	});

	it('returns nothing for input without table rows', async () => {
		const sessions = await loadSessionsFromFiles([
			textFile('meta.json', '{}'),
			textFile('clientLogs.log', 'noise')
		]);
		expect(sessions).toEqual([]);
	});

	it('parses recorded AOI geometry files and skips invalid ones', async () => {
		const { rawCsv } = buildCsvs();
		const geometry = {
			version: 1,
			slideIndex: 1,
			stimulusId: '5',
			viewport: { width: 1920, height: 1080 },
			aois: [
				{
					id: 'track',
					left: 10,
					top: 20,
					right: 110,
					bottom: 120,
					bufferSize: 50,
					fromTs: 1723380000000,
					toTs: 1723380002000
				},
				{ id: 'broken', left: 'x' }
			]
		};
		const session = await loadSingle([
			textFile('rawGazeData_slide1.csv', rawCsv),
			textFile('aoiGeometry_slide1.json', JSON.stringify(geometry)),
			textFile('aoiGeometry_slide2.json', 'not json')
		]);

		expect(session.recordedGeometry).toHaveLength(1);
		expect(session.recordedGeometry[0]).toMatchObject({
			slideIndex: 1,
			stimulusId: '5',
			viewport: { width: 1920, height: 1080 }
		});
		expect(session.recordedGeometry[0].aois).toEqual([
			{
				id: 'track',
				left: 10,
				top: 20,
				right: 110,
				bottom: 120,
				bufferSize: 50,
				fromTs: 1723380000000,
				toTs: 1723380002000
			}
		]);
	});

	it('extracts viewport, frequency and sample counts from meta.json', async () => {
		const { rawCsv } = buildCsvs();
		const meta = {
			metaVersion: 1,
			session: { samplesPerSlide: { 1: 2, 2: 50 } },
			viewport: { innerWidth: 1536, innerHeight: 864 },
			tracker: { signal: { measuredFrequencyHz: 119.6 } }
		};
		const session = await loadSingle([
			textFile('rawGazeData_slide1.csv', rawCsv),
			textFile('meta.json', JSON.stringify(meta))
		]);

		expect(session.meta).toEqual({
			viewport: { width: 1536, height: 864 },
			measuredFrequencyHz: 119.6,
			samplesPerSlide: { 1: 2, 2: 50 },
			recalculated: null
		});
		// Slide 1 has both recorded samples loaded; slide 2 lost all 50
		expect(session.warnings.some((w) => w.includes('Slide 2: načteno 0 z 50 raw vzorků'))).toBe(
			true
		);
		expect(session.warnings.some((w) => w.includes('Slide 1:'))).toBe(false);
	});

	it('surfaces the recalculated ledger from meta.json as a warning', async () => {
		const { rawCsv } = buildCsvs();
		const meta = {
			metaVersion: 1,
			session: {},
			recalculated: {
				at: '2026-09-01T10:00:00.000Z',
				appVersion: '1.2.3',
				items: ['meta', 'aoiGeometry']
			}
		};
		const session = await loadSingle([
			textFile('rawGazeData_slide1.csv', rawCsv),
			textFile('meta.json', JSON.stringify(meta))
		]);

		expect(session.meta?.recalculated).toEqual({
			at: '2026-09-01T10:00:00.000Z',
			items: ['meta', 'aoiGeometry']
		});
		expect(session.warnings.some((w) => w.includes('rekonstruována'))).toBe(true);
	});

	it('tolerates a malformed meta.json', async () => {
		const { rawCsv } = buildCsvs();
		const session = await loadSingle([
			textFile('rawGazeData_slide1.csv', rawCsv),
			textFile('meta.json', 'not json')
		]);
		expect(session.meta).toBeNull();
		expect(session.warnings.some((w) => w.includes('vzorků'))).toBe(false);
	});

	it('detects bridge-stamped recordings', async () => {
		const bridgeMs = Date.parse('2024-08-11T12:00:00.100Z');
		const csv = DatabaseExporter.createCsvContent(
			[
				rawEntry({ timestamp: bridgeMs }),
				rawEntry({ timestamp: bridgeMs + 8, bridgeTimeStamp: '2024-08-11T12:00:00.108Z' })
			],
			'rawGazeData'
		);
		const session = await loadSingle([textFile('rawGazeData_slide1.csv', csv)]);
		expect(session.bridgeStamped).toBe(true);
	});

	it('flags main-thread-stamped recordings as not bridge-stamped', async () => {
		const { rawCsv } = buildCsvs();
		const session = await loadSingle([textFile('rawGazeData_slide1.csv', rawCsv)]);
		expect(session.bridgeStamped).toBe(false);
	});

	it('removes duplicated rows from overlapping files and warns', async () => {
		const { rawCsv } = buildCsvs();
		const session = await loadSingle([
			textFile('rawGazeData_slide1.csv', rawCsv),
			textFile('rawGazeData_slide1_copy.csv', rawCsv)
		]);
		expect(session.rawGazeData).toHaveLength(2);
		expect(session.warnings.some((w) => w.includes('duplicitních'))).toBe(true);
	});
});

describe('loadSessionsFromZip', () => {
	it('loads a flat local export as one session', async () => {
		const { rawCsv, samplesCsv } = buildCsvs();
		const zip = new JSZip();
		zip.file('child/2024-08-11_cibule-1/rawGazeData_slide1.csv', rawCsv);
		zip.file('child/2024-08-11_cibule-1/gazeSamples_slide1.csv', samplesCsv);
		zip.file('child/2024-08-11_cibule-1/clientLogs.log', 'noise');
		const data = await zip.generateAsync({ type: 'uint8array' });

		const sessions = await loadSessionsFromZip(data);
		expect(sessions).toHaveLength(1);
		expect(sessions[0].rawGazeData).toHaveLength(2);
		expect(sessions[0].gazeSamples).toHaveLength(1);
		expect(sessions[0].sessionId).toBe(SESSION_ID);
		expect(sessions[0].exportFolder).toBe('child/2024-08-11_cibule-1');
	});

	it('splits a server export into its sessions and keeps their folders', async () => {
		const rawA = DatabaseExporter.createCsvContent([rawEntry()], 'rawGazeData');
		const rawB = DatabaseExporter.createCsvContent(
			[rawEntry({ child_id: 'other', session_id: '1723390000000', task_name: 'slabiky-2' })],
			'rawGazeData'
		);
		const geometry = JSON.stringify({
			slideIndex: 1,
			stimulusId: '5',
			viewport: { width: 1920, height: 1080 },
			aois: []
		});
		const zip = new JSZip();
		zip.file('child/2024-08-11_14-00-00_cibule-1/part_1/rawGazeData_slide1.csv', rawA);
		zip.file('child/2024-08-11_14-00-00_cibule-1/part_1/aoiGeometry_slide1.json', geometry);
		zip.file('child/2024-08-11_14-00-00_cibule-1/meta/meta.json', '{"metaVersion":1}');
		zip.file('child/2024-08-11_14-00-00_cibule-1/meta/clientLogs.log', 'noise');
		zip.file('other/2024-08-11_16-46-40_slabiky-2/part_1/rawGazeData_slide1.csv', rawB);
		zip.file('missing_files.txt', 'nothing');
		const data = await zip.generateAsync({ type: 'uint8array' });

		const sessions = await loadSessionsFromZip(data);
		expect(sessions.map((s) => s.exportFolder)).toEqual([
			'child/2024-08-11_14-00-00_cibule-1',
			'other/2024-08-11_16-46-40_slabiky-2'
		]);
		expect(sessions[0].recordedGeometry).toHaveLength(1);
		expect(sessions[0].metaRaw).toBe('{"metaVersion":1}');
		expect(sessions[1].childId).toBe('other');
		expect(sessions[1].recordedGeometry).toEqual([]);
	});

	it('uses the last two path segments as the session folder', async () => {
		const { rawCsv } = buildCsvs();
		const zip = new JSZip();
		zip.file(
			'develex_export/child/2024-08-11_14-00-00_cibule-1/part_1/rawGazeData_slide1.csv',
			rawCsv
		);
		const sessions = await loadSessionsFromZip(await zip.generateAsync({ type: 'uint8array' }));
		expect(sessions[0].exportFolder).toBe('child/2024-08-11_14-00-00_cibule-1');
	});
});

describe('loadRemoteSession', () => {
	it('downloads all table files including rawGazeData and derives identity', async () => {
		const { rawCsv, samplesCsv } = buildCsvs();
		const filesById: Record<string, string> = {
			'f-raw': rawCsv,
			'f-samples': samplesCsv
		};

		vi.mocked(getTestSessionDetail).mockResolvedValue({
			id: 'remote-1',
			testType: 'cibule-1',
			parts: [
				{
					id: 'p1',
					files: [
						{ id: 'f-raw', fileName: 'rawGazeData_slide1.csv' },
						{ id: 'f-samples', fileName: 'gazeSamples_slide1.csv' },
						{ id: 'f-logs', fileName: 'clientLogs.log' }
					]
				}
			],
			files: [{ id: 'f-raw', fileName: 'rawGazeData_slide1.csv' }]
		} as never);
		vi.mocked(downloadTestSessionFile).mockImplementation((_session, fileId) =>
			Promise.resolve(new Blob([filesById[fileId as string] ?? '']))
		);

		const session = await loadRemoteSession({
			id: 'remote-1',
			username: 'child',
			testType: 'cibule-1',
			sessionStartTime: '2024-08-11T14:00:00'
		});

		expect(vi.mocked(downloadTestSessionFile)).toHaveBeenCalledTimes(2);
		expect(session.childId).toBe('child');
		expect(session.sessionId).toBe(SESSION_ID);
		expect(session.taskName).toBe('cibule-1');
		expect(session.rawGazeData).toHaveLength(2);
		expect(session.gazeSamples).toHaveLength(1);
		expect(session.exportFolder).toBe('child/2024-08-11_14-00-00_cibule-1');
	});
});
