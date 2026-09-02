import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TestSessionDetailDTO } from '$lib/types/api.types';
import { downloadTestSessionFile } from '$lib/api/test-sessions';
import { loadRecalcSessionData } from './sessionData';

vi.mock('$lib/api/test-sessions', () => ({
	downloadTestSessionFile: vi.fn()
}));

const RAW_HEADER =
	'ID,Child ID,Session ID,Task,Slide Index,Timestamp,Bridge Timestamp,Device Timestamp,X,Y,Left X,Left Y,Left Validity,Left Pupil Diameter,Right X,Right Y,Right Validity,Right Pupil Diameter';
const SAMPLES_HEADER =
	'ID,Child ID,Session ID,Task,Slide Index,Stimulus ID,Timestamp,Device Timestamp,Eye X,Eye Y,AOI,Mouse X,Mouse Y,Event,Sound,Mistake Type,Result';

function rawRow(timestamp: string): string {
	return `1,child,2026-04-13T14:53:32Z,cibule-1,1,${timestamp},b,d,100,200,100,200,true,2,100,200,true,2`;
}

function sampleRow(timestamp: string): string {
	return `1,child,2026-04-13T14:53:32Z,cibule-1,1,stim-a,${timestamp},d,100,200,,0,0,,,,`;
}

const GEOMETRY = JSON.stringify({
	version: 1,
	slideIndex: 1,
	stimulusId: 'stim-a',
	viewport: { width: 1600, height: 900 },
	aois: []
});
const META = JSON.stringify({ viewport: { innerWidth: 1280, innerHeight: 720 } });

function detailWith(files: { id: string; fileName: string }[]): TestSessionDetailDTO {
	return { id: 'remote-1', parts: [{ id: 'p1', files }] } as unknown as TestSessionDetailDTO;
}

function serveFiles(filesById: Record<string, string>) {
	vi.mocked(downloadTestSessionFile).mockImplementation((_session, fileId) =>
		Promise.resolve(new Blob([filesById[fileId] ?? '']))
	);
}

describe('loadRecalcSessionData', () => {
	beforeEach(() => {
		vi.mocked(downloadTestSessionFile).mockReset();
	});

	it('downloads only raw, samples, geometry and meta files, skipping backups', async () => {
		serveFiles({
			raw: [RAW_HEADER, rawRow('2026-04-13T14:55:02.936Z')].join('\n'),
			samples: [SAMPLES_HEADER, sampleRow('2026-04-13T14:55:02.936Z')].join('\n'),
			geometry: GEOMETRY,
			meta: META
		});
		const detail = detailWith([
			{ id: 'raw', fileName: 'rawGazeData_slide1.csv' },
			{ id: 'samples', fileName: 'gazeSamples_slide1.csv' },
			{ id: 'fixations', fileName: 'fixationData_slide1.csv' },
			{ id: 'scores', fileName: 'sessionScores.csv' },
			{ id: 'backup', fileName: 'backup_20260901-120000_rawGazeData_slide1.csv' },
			{ id: 'geometry', fileName: 'aoiGeometry_slide1.json' },
			{ id: 'meta', fileName: 'meta.json' }
		]);

		const data = await loadRecalcSessionData(detail);

		expect(vi.mocked(downloadTestSessionFile)).toHaveBeenCalledTimes(4);
		expect(data.rawGazeData).toHaveLength(1);
		expect(data.gazeSamples).toHaveLength(1);
		expect(data.metaRaw).toBe(META);
		expect(data.recordedViewport).toEqual({ width: 1600, height: 900 });
	});

	it('falls back to the meta.json viewport, then to none', async () => {
		serveFiles({ raw: RAW_HEADER, meta: META });

		const withMeta = await loadRecalcSessionData(
			detailWith([
				{ id: 'raw', fileName: 'rawGazeData_slide1.csv' },
				{ id: 'meta', fileName: 'meta.json' }
			])
		);
		expect(withMeta.recordedViewport).toEqual({ width: 1280, height: 720 });

		const rawOnly = await loadRecalcSessionData(
			detailWith([{ id: 'raw', fileName: 'rawGazeData_slide1.csv' }])
		);
		expect(rawOnly.recordedViewport).toBeNull();
		expect(rawOnly.metaRaw).toBeNull();
	});

	it('sorts rows by timestamp', async () => {
		serveFiles({
			raw: [
				RAW_HEADER,
				rawRow('2026-04-13T14:55:03.000Z'),
				rawRow('2026-04-13T14:55:02.000Z')
			].join('\n')
		});

		const data = await loadRecalcSessionData(
			detailWith([{ id: 'raw', fileName: 'rawGazeData_slide1.csv' }])
		);

		expect(data.rawGazeData.map((row) => row.timestamp)).toEqual([
			Date.parse('2026-04-13T14:55:02.000Z'),
			Date.parse('2026-04-13T14:55:03.000Z')
		]);
	});
});
