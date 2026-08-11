import { describe, expect, it } from 'vitest';
import type { RawGazeDataEntry } from '$lib/database/db.types';
import { IdtFixationDetector } from './idtAdapter';
import { DEFAULT_DETECTOR_PARAMS, type ReplayFixationEvent } from '../types';

const BASE_MS = Date.parse('2024-08-11T12:00:00.000Z');

function sampleAt(offsetMs: number, x: number, y: number, valid = true): RawGazeDataEntry {
	const iso = new Date(BASE_MS + offsetMs).toISOString();
	return {
		child_id: 'child',
		session_id: 'session',
		task_name: 'cibule-1',
		slide_index: 1,
		timestamp: BASE_MS + offsetMs,
		bridgeTimeStamp: iso,
		deviceTimeStamp: iso,
		x,
		y,
		xL: x,
		yL: y,
		validityL: valid,
		pupilDiameterL: 3,
		xR: x,
		yR: y,
		validityR: valid,
		pupilDiameterR: 3
	};
}

function collect(detector: IdtFixationDetector) {
	const starts: ReplayFixationEvent[] = [];
	const ends: ReplayFixationEvent[] = [];
	detector.onFixationStart((f) => starts.push(f));
	detector.onFixationEnd((f) => ends.push(f));
	return { starts, ends };
}

/** 100 Hz cluster at (x, y) spanning [fromMs, toMs). */
function cluster(fromMs: number, toMs: number, x: number, y: number): RawGazeDataEntry[] {
	const samples: RawGazeDataEntry[] = [];
	for (let t = fromMs; t < toMs; t += 10) samples.push(sampleAt(t, x, y));
	return samples;
}

describe('IdtFixationDetector', () => {
	it('detects a fixation from a tight cluster and ends it on dispersion break', () => {
		const detector = new IdtFixationDetector();
		const { starts, ends } = collect(detector);

		[...cluster(0, 300, 100, 100), ...cluster(300, 500, 600, 100)].forEach((s) =>
			detector.process(s)
		);

		expect(starts.length).toBeGreaterThanOrEqual(1);
		expect(ends).toHaveLength(1);
		expect(ends[0].fixationId).toBe(starts[0].fixationId);
		expect(ends[0].duration).toBeGreaterThanOrEqual(
			DEFAULT_DETECTOR_PARAMS.minimumFixationDurationMs
		);
		expect(ends[0].duration).toBeLessThanOrEqual(300);
		expect(ends[0].x).toBeCloseTo(100, 0);
		expect(ends[0].y).toBeCloseTo(100, 0);
	});

	it('respects the default dispersion tolerance (~62 px)', () => {
		const under = new IdtFixationDetector();
		const underEvents = collect(under);
		// Alternating 60 px apart: bounding-box dispersion 60 < tolerance
		for (let t = 0; t < 300; t += 10) under.process(sampleAt(t, t % 20 === 0 ? 0 : 60, 100));
		expect(underEvents.starts.length).toBeGreaterThanOrEqual(1);

		const over = new IdtFixationDetector();
		const overEvents = collect(over);
		// Alternating 70 px apart: dispersion 70 > tolerance, window keeps shrinking
		for (let t = 0; t < 300; t += 10) over.process(sampleAt(t, t % 20 === 0 ? 0 : 70, 100));
		expect(overEvents.starts).toHaveLength(0);
	});

	it('honors a custom minimum fixation duration', () => {
		const strict = new IdtFixationDetector({
			...DEFAULT_DETECTOR_PARAMS,
			minimumFixationDurationMs: 100
		});
		const strictEvents = collect(strict);
		cluster(0, 70, 100, 100).forEach((s) => strict.process(s));
		expect(strictEvents.starts).toHaveLength(0);

		const loose = new IdtFixationDetector({
			...DEFAULT_DETECTOR_PARAMS,
			minimumFixationDurationMs: 50
		});
		const looseEvents = collect(loose);
		cluster(0, 70, 100, 100).forEach((s) => loose.process(s));
		expect(looseEvents.starts).toHaveLength(1);
	});

	it('ignores samples with both eyes invalid', () => {
		const detector = new IdtFixationDetector();
		const { starts, ends } = collect(detector);

		const samples = cluster(0, 300, 100, 100);
		// Garbage coordinates on invalid samples must not break the first fixation;
		// the second cluster legitimately starts a fixation of its own
		samples.splice(15, 0, sampleAt(151, 0, 0, false), sampleAt(152, 9999, 9999, false));
		[...samples, ...cluster(300, 500, 600, 100)].forEach((s) => detector.process(s));

		expect(starts).toHaveLength(2);
		expect(ends).toHaveLength(1);
		expect(ends[0].x).toBeCloseTo(100, 0);
	});

	it('flush finishes an in-progress fixation', () => {
		const detector = new IdtFixationDetector();
		const { starts, ends } = collect(detector);

		cluster(0, 300, 100, 100).forEach((s) => detector.process(s));
		expect(starts).toHaveLength(1);
		expect(ends).toHaveLength(0);

		detector.flush();
		expect(ends).toHaveLength(1);
		expect(ends[0].fixationId).toBe(starts[0].fixationId);
	});

	it('assigns distinct increasing fixation ids', () => {
		const detector = new IdtFixationDetector();
		const { starts } = collect(detector);

		[
			...cluster(0, 300, 100, 100),
			...cluster(300, 700, 600, 100),
			...cluster(700, 1000, 100, 500)
		].forEach((s) => detector.process(s));

		expect(starts.length).toBeGreaterThanOrEqual(2);
		const ids = starts.map((s) => s.fixationId);
		expect(new Set(ids).size).toBe(ids.length);
		expect([...ids].sort((a, b) => a - b)).toEqual(ids);
	});
});
