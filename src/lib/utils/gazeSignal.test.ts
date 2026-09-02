import { describe, expect, it } from 'vitest';
import { GazeSignalAccumulator, measureFrequencyHz } from './gazeSignal';

const START_MS = Date.parse('2026-01-01T10:00:00.000Z');

function stream(intervalsMs: number[]): GazeSignalAccumulator {
	const signal = new GazeSignalAccumulator();
	let deviceMs = START_MS;
	signal.add(new Date(deviceMs).toISOString(), true);
	for (const interval of intervalsMs) {
		deviceMs += interval;
		signal.add(new Date(deviceMs).toISOString(), true);
	}
	return signal;
}

function repeat(pattern: number[], times: number): number[] {
	return Array.from({ length: times }, () => pattern).flat();
}

describe('measureFrequencyHz', () => {
	it('cancels the millisecond rounding of a regular stream', () => {
		expect(stream(repeat([8, 8, 9], 100)).summary().measuredFrequencyHz).toBe(120);
		expect(stream(repeat([7, 7, 6], 100)).summary().measuredFrequencyHz).toBe(150);
		expect(stream(repeat([3, 3, 4], 100)).summary().measuredFrequencyHz).toBe(300);
	});

	it('ignores dropped samples, which a span average would count as slower sampling', () => {
		expect(stream(repeat([4, 4, 4, 8], 100)).summary().measuredFrequencyHz).toBe(250);
	});

	it('ignores pauses in the stream', () => {
		const intervals = [...repeat([4], 50), 3000, ...repeat([4], 50)];
		expect(stream(intervals).summary().measuredFrequencyHz).toBe(250);
	});

	it('skips duplicate and backwards timestamps', () => {
		expect(stream([4, 0, 4, -4000, 4, 4]).summary().measuredFrequencyHz).toBe(250);
	});

	it('is null without two timed samples', () => {
		expect(new GazeSignalAccumulator().summary().measuredFrequencyHz).toBeNull();
		expect(stream([]).summary().measuredFrequencyHz).toBeNull();
		expect(measureFrequencyHz(new Map())).toBeNull();
	});

	it('is null when the typical interval is not a sampling period', () => {
		expect(stream(repeat([1_438_003], 5)).summary().measuredFrequencyHz).toBeNull();
	});
});

describe('GazeSignalAccumulator', () => {
	it('counts samples, validity and parseable device timestamps', () => {
		const signal = new GazeSignalAccumulator();
		signal.add('2026-01-01T10:00:00.000Z', true);
		signal.add('2026-01-01T10:00:00.008Z', false);
		signal.add('invalid', true);

		expect(signal.summary()).toEqual({
			sampleCount: 3,
			validSampleCount: 2,
			timedSampleCount: 2,
			measuredFrequencyHz: 125,
			firstDeviceSampleAt: '2026-01-01T10:00:00.000Z',
			lastDeviceSampleAt: '2026-01-01T10:00:00.008Z'
		});
	});
});
