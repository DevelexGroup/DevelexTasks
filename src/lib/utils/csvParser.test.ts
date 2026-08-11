import { describe, expect, it } from 'vitest';
import type {
	FixationDataEntry,
	GazeSampleDataEntry,
	RawGazeDataEntry
} from '$lib/database/db.types';
import { DatabaseExporter } from './databaseExport';
import { parseFixationDataCsv, parseGazeSamplesCsv, parseRawGazeDataCsv } from './csvParser';

// Second precision, because Session ID round-trips through a second-precision format
const SESSION_ID = '1723380000000';

function rawEntry(overrides: Partial<RawGazeDataEntry> = {}): RawGazeDataEntry {
	return {
		id: 1,
		child_id: 'child',
		session_id: SESSION_ID,
		task_name: 'cibule-1',
		slide_index: 1,
		timestamp: 1723380000100,
		bridgeTimeStamp: '2024-08-11T12:00:00.100Z',
		deviceTimeStamp: '2024-08-11T12:00:00.099Z',
		x: 100.5,
		y: 200.25,
		xL: 99.5,
		yL: 199.25,
		validityL: true,
		pupilDiameterL: 3.5,
		xR: 101.5,
		yR: 201.25,
		validityR: false,
		pupilDiameterR: 3.25,
		...overrides
	};
}

describe('parseRawGazeDataCsv', () => {
	it('round-trips entries through createCsvContent', () => {
		const entries = [
			rawEntry(),
			rawEntry({ id: 2, timestamp: 1723380000200, validityL: false, validityR: false })
		];
		const csv = DatabaseExporter.createCsvContent([...entries], 'rawGazeData');
		const parsed = parseRawGazeDataCsv(csv);

		expect(parsed).toHaveLength(2);
		parsed.forEach((entry, i) => {
			const { id, ...expected } = entries[i];
			void id;
			expect(entry).toEqual(expected);
		});
	});

	it('truncates session_id to second precision', () => {
		const csv = DatabaseExporter.createCsvContent(
			[rawEntry({ session_id: '1723380000123' })],
			'rawGazeData'
		);
		expect(parseRawGazeDataCsv(csv)[0].session_id).toBe('1723380000000');
	});

	it('returns empty array for header-only input', () => {
		const csv = DatabaseExporter.createCsvContent([], 'rawGazeData');
		expect(parseRawGazeDataCsv(csv)).toEqual([]);
	});
});

describe('existing parsers round-trip', () => {
	it('round-trips gazeSamples including quoted array values', () => {
		const entry: GazeSampleDataEntry = {
			id: 1,
			child_id: 'child',
			session_id: SESSION_ID,
			task_name: 'cibule-1',
			slide_index: 2,
			stimulus_id: '5',
			timestamp: 1723380000100,
			device_timestamp: '2024-08-11T12:00:00.099Z',
			eyetracker_x: 10,
			eyetracker_y: 20,
			aoi: ['hint', 'track'],
			mouse_x: 5,
			mouse_y: 6,
			events: ['dwell-finish_slide-2_initial', 'complete-slide-2'],
			sound_name: [],
			mistake_type: ['misclick'],
			task_result: null
		};
		const csv = DatabaseExporter.createCsvContent([entry], 'gazeSamples');
		const parsed = parseGazeSamplesCsv(csv);

		expect(parsed).toHaveLength(1);
		const { id, ...expected } = entry;
		void id;
		expect(parsed[0]).toEqual(expected);
	});

	it('round-trips fixationData', () => {
		const entry: FixationDataEntry = {
			id: 1,
			child_id: 'child',
			session_id: SESSION_ID,
			task_name: 'cibule-1',
			slide_index: 2,
			stimulus_id: '5',
			timestamp: 1723380000100,
			eyetracker_x: 10.5,
			eyetracker_y: 20.5,
			duration: 250,
			aoi: ['hint'],
			fixation_index: 3
		};
		const csv = DatabaseExporter.createCsvContent([entry], 'fixationData');
		const parsed = parseFixationDataCsv(csv);

		expect(parsed).toHaveLength(1);
		const { id, ...expected } = entry;
		void id;
		expect(parsed[0]).toEqual(expected);
	});
});
