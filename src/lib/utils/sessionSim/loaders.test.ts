import { describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import type { GazeSampleDataEntry, RawGazeDataEntry } from '$lib/database/db.types';
import { DatabaseExporter } from '$lib/utils/databaseExport';
import { classifyFileName, loadFromFiles, loadFromZip, loadRemoteSession } from './loaders';
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

describe('classifyFileName', () => {
	it('routes table files and ignores the rest', () => {
		expect(classifyFileName('rawGazeData_slide1.csv')).toBe('rawGazeData');
		expect(classifyFileName('gazeSamples_slide2.csv')).toBe('gazeSamples');
		expect(classifyFileName('fixationData.csv')).toBe('fixationData');
		expect(classifyFileName('sessionScores.csv')).toBe('sessionScores');
		expect(classifyFileName('clientLogs.log')).toBeNull();
	});
});

describe('loadFromFiles', () => {
	it('assembles a session from loose CSVs, sorted and with derived identity', async () => {
		const { rawCsv, samplesCsv } = buildCsvs();
		const session = await loadFromFiles([
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
		expect(session.maxSlides).toBe(2);
		expect(session.warnings).toEqual([]);
	});

	it('warns when raw gaze data is missing', async () => {
		const { samplesCsv } = buildCsvs();
		const session = await loadFromFiles([textFile('gazeSamples_slide2.csv', samplesCsv)]);
		expect(session.warnings.some((w) => w.includes('rawGazeData'))).toBe(true);
	});
});

describe('loadFromZip', () => {
	it('loads table CSVs from nested folders', async () => {
		const { rawCsv, samplesCsv } = buildCsvs();
		const zip = new JSZip();
		zip.file('child/2024-08-11_cibule-1/rawGazeData_slide1.csv', rawCsv);
		zip.file('child/2024-08-11_cibule-1/gazeSamples_slide1.csv', samplesCsv);
		zip.file('child/2024-08-11_cibule-1/clientLogs.log', 'noise');
		const data = await zip.generateAsync({ type: 'uint8array' });

		const session = await loadFromZip(data);
		expect(session.rawGazeData).toHaveLength(2);
		expect(session.gazeSamples).toHaveLength(1);
		expect(session.sessionId).toBe(SESSION_ID);
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

		const session = await loadRemoteSession('remote-1', 'child');

		expect(vi.mocked(downloadTestSessionFile)).toHaveBeenCalledTimes(2);
		expect(session.childId).toBe('child');
		expect(session.sessionId).toBe(SESSION_ID);
		expect(session.taskName).toBe('cibule-1');
		expect(session.rawGazeData).toHaveLength(2);
		expect(session.gazeSamples).toHaveLength(1);
	});
});
