import { describe, expect, it } from 'vitest';
import type { PostProcessor, PostProcessorOutput } from '$lib/api/test-sessions';
import {
	outputProcessorOf,
	parseOutputCsv,
	readOutputRows,
	serializeOutputCsv,
	shiftOutputFile,
	slideOfOutputFile
} from './outputs';

const schema: PostProcessorOutput = {
	slideColumn: 'Slide Index',
	timeColumn: 'Timestamp',
	durationColumn: 'Duration',
	points: [{ x: 'Eye X', y: 'Eye Y' }],
	aoiColumn: 'AOI',
	spatialMetrics: ['RMSxy']
};

function processor(name: string, outputFilePrefix: string): PostProcessor {
	return {
		name,
		label: name,
		description: '',
		inputFilePrefix: 'rawGazeData',
		auxiliaryInputFilePrefixes: [],
		outputFilePrefix,
		parameters: [],
		output: schema
	};
}

const CSV = [
	'Slide Index,Timestamp,Eye X,Eye Y,Duration,AOI,RMSxy,Note',
	'1,2026-09-01T10:00:00.000Z,100,200,150,word-1,0.5,"a, b"',
	'1,2026-09-01T10:00:01.000Z,,,80,,0.4,',
	'2,2026-09-01T10:00:02.000Z,300,400,120,word-2,0.3,'
].join('\n');

describe('outputProcessorOf', () => {
	const processors = [processor('i2mc', 'I2MC_fixationData')];

	it('matches by output prefix and skips backups', () => {
		expect(outputProcessorOf('I2MC_fixationData_slide1.csv', processors)?.name).toBe('i2mc');
		expect(outputProcessorOf('fixationData_slide1.csv', processors)).toBeNull();
		expect(
			outputProcessorOf('backup_20260902-101530_I2MC_fixationData_slide1.csv', processors)
		).toBeNull();
	});
});

describe('reading outputs', () => {
	const file = parseOutputCsv('I2MC_fixationData_slide1.csv', CSV);

	it('reads declared columns and keeps empty points as null', () => {
		const rows = readOutputRows(file, schema);
		expect(rows).toHaveLength(3);
		expect(rows[0]).toEqual({
			slide: 1,
			time: Date.parse('2026-09-01T10:00:00.000Z'),
			duration: 150,
			points: [{ x: 100, y: 200 }],
			aoi: ['word-1']
		});
		expect(rows[1].points).toEqual([null]);
	});

	it('tolerates older files without a declared column', () => {
		const older = parseOutputCsv('x.csv', 'Slide Index,Timestamp,Eye X,Eye Y\n3,1000,1,2');
		expect(readOutputRows(older, schema)[0]).toMatchObject({ slide: 3, duration: null, aoi: [] });
	});

	it('round-trips cells, including quoted ones', () => {
		expect(parseOutputCsv(file.fileName, serializeOutputCsv(file))).toEqual(file);
	});

	it('takes the slide from rows, else from the file name', () => {
		expect(slideOfOutputFile(file, schema)).toBe(1);
		const empty = parseOutputCsv('I2MC_fixationData_slide7.csv', 'Slide Index,Timestamp');
		expect(slideOfOutputFile(empty, schema)).toBe(7);
	});
});

describe('shiftOutputFile', () => {
	const file = parseOutputCsv('I2MC_fixationData_slide1.csv', CSV);
	const start = Date.parse('2026-09-01T10:00:00.000Z');

	it('moves points of mapped slides and re-attributes their AOI', () => {
		const shifted = shiftOutputFile(file, schema, {
			mapperFor: (slide) => (slide === 1 ? (x, y) => ({ x: x + 50.12345, y }) : null),
			aoisFor: () => [
				{ id: 'word-3', left: 140, top: 180, right: 160, bottom: 220, bufferSize: 0 },
				{
					id: 'later',
					left: 0,
					top: 0,
					right: 999,
					bottom: 999,
					bufferSize: 0,
					fromTs: start + 1000
				}
			]
		});
		expect(shifted.rows[0]).toEqual([
			'1',
			'2026-09-01T10:00:00.000Z',
			'150.123',
			'200',
			'150',
			'word-3',
			'0.5',
			'a, b'
		]);
		expect(shifted.rows[1]).toEqual(file.rows[1]);
		expect(shifted.rows[2]).toEqual(file.rows[2]);
	});

	it('keeps the stored AOI cell without geometry and returns the same file when nothing moves', () => {
		const moved = shiftOutputFile(file, schema, {
			mapperFor: () => (x, y) => ({ x, y: y + 1 }),
			aoisFor: () => null
		});
		expect(moved.rows[0][5]).toBe('word-1');
		expect(moved.rows[0][3]).toBe('201');

		const untouched = shiftOutputFile(file, schema, { mapperFor: () => null, aoisFor: () => null });
		expect(untouched).toBe(file);
	});
});
