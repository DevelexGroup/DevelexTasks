import { describe, expect, it } from 'vitest';
import type { GazeSampleDataEntry, RawGazeDataEntry } from '$lib/database/db.types';
import { TaskResult } from '$lib/types/task.types';
import type { TestSessionDetailDTO } from '$lib/types/api.types';
import { buildRecalculatedMeta, mergeRecalculatedLedger } from './metaRebuild';

function rawEntry(overrides: Partial<RawGazeDataEntry> = {}): RawGazeDataEntry {
	return {
		child_id: 'child',
		session_id: 'local-1',
		task_name: 'cibule-1',
		slide_index: 1,
		timestamp: 1723380000100,
		bridgeTimeStamp: '2024-08-11T12:00:00.100Z',
		deviceTimeStamp: '2024-08-11T12:00:00.000Z',
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
		session_id: 'local-1',
		task_name: 'cibule-1',
		slide_index: 1,
		stimulus_id: '5',
		timestamp: 1723380000100,
		device_timestamp: '2024-08-11T12:00:00.000Z',
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

const detail = {
	id: 'remote-1',
	userId: 'user-1',
	username: 'child',
	testType: 'cibule-1-evaluation',
	sessionStartTime: '2024-08-11T12:00:00.000Z',
	sessionEndTime: '2024-08-11T12:05:00.000Z'
} as unknown as TestSessionDetailDTO;

describe('buildRecalculatedMeta', () => {
	it('recovers identity, mode and per-slide counts from known data', () => {
		const meta = buildRecalculatedMeta({
			detail,
			rawGazeData: [
				rawEntry(),
				rawEntry({ slide_index: 2, validityL: false, validityR: false }),
				rawEntry({ slide_index: 2, deviceTimeStamp: 'invalid' })
			],
			gazeSamples: [sampleEntry(), sampleEntry({ task_result: TaskResult.Natural })],
			viewport: { width: 1536, height: 864 },
			items: ['meta']
		});

		expect(meta.metaVersion).toBe(1);
		expect(meta.session.remoteSessionId).toBe('remote-1');
		expect(meta.session.localSessionId).toBe('local-1');
		expect(meta.session.task).toBe('cibule-1-evaluation');
		expect(meta.session.taskMode).toBe('evaluation');
		expect(meta.session.result).toBe(TaskResult.Natural);
		expect(meta.session.startedAt).toBe('2024-08-11T12:00:00.000Z');
		expect(meta.session.samplesPerSlide).toEqual({ 1: 1, 2: 2 });
		expect(meta.viewport.innerWidth).toBe(1536);
		expect(meta.tracker.signal.sampleCount).toBe(3);
		expect(meta.tracker.signal.validSampleCount).toBe(2);
		expect(meta.tracker.signal.timedSampleCount).toBe(2);
		expect(meta.recalculated?.items).toEqual(['meta']);
	});

	it('defaults the task mode to reeducation when the name has no suffix', () => {
		const meta = buildRecalculatedMeta({
			detail: { ...detail, testType: 'cibule-1' } as TestSessionDetailDTO,
			rawGazeData: [],
			gazeSamples: [],
			viewport: { width: 1920, height: 1080 },
			items: ['meta']
		});
		expect(meta.session.taskMode).toBe('reeducation');
		expect(meta.session.result).toBeNull();
	});
});

describe('mergeRecalculatedLedger', () => {
	it('adds the ledger without touching other fields and unions items', () => {
		const original = JSON.stringify({
			metaVersion: 1,
			session: { task: 'cibule-1' },
			recalculated: { at: 'old', appVersion: 'old', items: ['meta'] }
		});

		const merged = JSON.parse(mergeRecalculatedLedger(original, ['aoiGeometry', 'meta']));
		expect(merged.session).toEqual({ task: 'cibule-1' });
		expect(merged.recalculated.items.sort()).toEqual(['aoiGeometry', 'meta']);
		expect(merged.recalculated.at).not.toBe('old');
	});
});
