import { describe, expect, it } from 'vitest';
import type { GazeSampleDataEntry, RawGazeDataEntry } from '$lib/database/db.types';
import { slideStartTimestamps, stimulusBySlide } from './sessionData';

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
		stimulus_id: 'stim-a',
		timestamp: 1723380000200,
		device_timestamp: '2024-08-11T12:00:00.000Z',
		eyetracker_x: 100,
		eyetracker_y: 200,
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

describe('stimulusBySlide', () => {
	it('keeps the first real stimulus id per slide', () => {
		const samples = [
			sampleEntry({ slide_index: 1, stimulus_id: 'null' }),
			sampleEntry({ slide_index: 1, stimulus_id: 'stim-a' }),
			sampleEntry({ slide_index: 1, stimulus_id: 'stim-b' }),
			sampleEntry({ slide_index: 2, stimulus_id: 'stim-c' })
		];
		expect(stimulusBySlide(samples)).toEqual({ 1: 'stim-a', 2: 'stim-c' });
	});

	it('leaves slides without a stimulus out', () => {
		expect(stimulusBySlide([sampleEntry({ stimulus_id: 'null' })])).toEqual({});
		expect(stimulusBySlide([])).toEqual({});
	});
});

describe('slideStartTimestamps', () => {
	it('takes the earliest timestamp per slide across raw gaze and samples', () => {
		const raw = [
			rawEntry({ slide_index: 1, timestamp: 1000 }),
			rawEntry({ slide_index: 1, timestamp: 900 }),
			rawEntry({ slide_index: 2, timestamp: 5000 })
		];
		const samples = [
			sampleEntry({ slide_index: 1, timestamp: 950 }),
			sampleEntry({ slide_index: 2, timestamp: 4800 }),
			sampleEntry({ slide_index: 3, timestamp: 7000 })
		];
		expect(slideStartTimestamps(raw, samples)).toEqual({ 1: 900, 2: 4800, 3: 7000 });
	});

	it('handles empty input', () => {
		expect(slideStartTimestamps([], [])).toEqual({});
	});
});
