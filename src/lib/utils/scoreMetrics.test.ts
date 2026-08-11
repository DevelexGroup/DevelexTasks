import { describe, expect, it, vi } from 'vitest';
import type { FixationDataEntry, GazeSampleDataEntry } from '$lib/database/db.types';
import {
	calculateAOIFieldFixations,
	calculateAOITargetFixations,
	calculateErrorRate,
	calculateMeanFixationDuration,
	calculateRegressionCount,
	calculateResponseTime,
	filterFixationsInWindow,
	filterSamplesInWindow,
	getEffectiveTimeWindow,
	getEffectiveTimeWindows
} from './scoreMetrics';

function sample(overrides: Partial<GazeSampleDataEntry> = {}): GazeSampleDataEntry {
	return {
		child_id: 'child',
		session_id: 'session',
		task_name: 'cibule-1',
		stimulus_id: '1',
		timestamp: 0,
		slide_index: 1,
		eyetracker_x: 0,
		eyetracker_y: 0,
		device_timestamp: '',
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

function fixation(overrides: Partial<FixationDataEntry> = {}): FixationDataEntry {
	return {
		child_id: 'child',
		session_id: 'session',
		task_name: 'cibule-1',
		stimulus_id: '1',
		timestamp: 0,
		slide_index: 1,
		eyetracker_x: 0,
		eyetracker_y: 0,
		duration: 100,
		aoi: [],
		fixation_index: 0,
		...overrides
	};
}

describe('getEffectiveTimeWindow', () => {
	it('finds the window between initial dwell and complete events', () => {
		const samples = [
			sample({ timestamp: 100 }),
			sample({ timestamp: 200, events: ['dwell-finish_slide-2_initial'] }),
			sample({ timestamp: 300 }),
			sample({ timestamp: 400, events: ['complete-slide-2'] }),
			sample({ timestamp: 500 })
		];
		expect(getEffectiveTimeWindow(samples, 2)).toEqual({
			slideIndex: 2,
			startTime: 200,
			endTime: 400
		});
	});

	it('returns null when the complete event is missing', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const samples = [sample({ timestamp: 200, events: ['dwell-finish_slide-2_initial'] })];
		expect(getEffectiveTimeWindow(samples, 2)).toBeNull();
		errorSpy.mockRestore();
	});

	it('ignores events of other slides', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const samples = [
			sample({ timestamp: 200, events: ['dwell-finish_slide-1_initial'] }),
			sample({ timestamp: 400, events: ['complete-slide-1'] })
		];
		expect(getEffectiveTimeWindow(samples, 2)).toBeNull();
		errorSpy.mockRestore();
	});
});

describe('getEffectiveTimeWindows', () => {
	it('collects all windows by event prefix', () => {
		const samples = [
			sample({ timestamp: 100, events: ['dwell-finish_slide-1_initial'] }),
			sample({ timestamp: 200, events: ['complete-slide-1'] }),
			sample({ timestamp: 300, events: ['dwell-finish_slide-2_initial'] }),
			sample({ timestamp: 450, events: ['complete-slide-2'] })
		];
		expect(getEffectiveTimeWindows(samples)).toEqual([
			{ slideIndex: 0, startTime: 100, endTime: 200 },
			{ slideIndex: 1, startTime: 300, endTime: 450 }
		]);
	});

	it('ignores a trailing window without a complete event', () => {
		const samples = [
			sample({ timestamp: 100, events: ['dwell-finish_slide-1_initial'] }),
			sample({ timestamp: 200, events: ['complete-slide-1'] }),
			sample({ timestamp: 300, events: ['dwell-finish_slide-2_initial'] })
		];
		expect(getEffectiveTimeWindows(samples)).toHaveLength(1);
	});
});

describe('window filtering', () => {
	const window = { slideIndex: 1, startTime: 100, endTime: 200 };

	it('includes samples on inclusive bounds', () => {
		const samples = [99, 100, 150, 200, 201].map((timestamp) => sample({ timestamp }));
		expect(filterSamplesInWindow(samples, window).map((s) => s.timestamp)).toEqual([100, 150, 200]);
	});

	it('filters fixations by their start timestamp', () => {
		const fixations = [99, 100, 200, 201].map((timestamp) =>
			fixation({ timestamp, duration: 500 })
		);
		expect(filterFixationsInWindow(fixations, window).map((f) => f.timestamp)).toEqual([100, 200]);
	});
});

describe('calculateErrorRate', () => {
	it('counts only misclick, skipped and wrong-order mistakes', () => {
		const samples = [
			sample({ mistake_type: ['misclick', 'skipped'] }),
			sample({ mistake_type: ['wrong-order'] }),
			sample({ mistake_type: ['other'] }),
			sample({ mistake_type: [] })
		];
		expect(calculateErrorRate(samples)).toBe(3);
	});
});

describe('calculateResponseTime', () => {
	it('returns 0 for no samples', () => {
		expect(calculateResponseTime([])).toBe(0);
	});

	it('returns last minus first timestamp', () => {
		const samples = [100, 150, 900].map((timestamp) => sample({ timestamp }));
		expect(calculateResponseTime(samples)).toBe(800);
	});
});

describe('calculateMeanFixationDuration', () => {
	it('returns 0 for no fixations', () => {
		expect(calculateMeanFixationDuration([])).toBe(0);
	});

	it('averages durations', () => {
		const fixations = [100, 200, 300].map((duration) => fixation({ duration }));
		expect(calculateMeanFixationDuration(fixations)).toBe(200);
	});
});

describe('AOI fixation counts', () => {
	const fixations = [
		fixation({ aoi: ['hint'] }),
		fixation({ aoi: ['hint', 'track'] }),
		fixation({ aoi: ['track'] }),
		fixation({ aoi: [] })
	];

	it('counts fixations containing the hint AOI', () => {
		expect(calculateAOITargetFixations(fixations)).toBe(2);
	});

	it('counts fixations containing the track AOI', () => {
		expect(calculateAOIFieldFixations(fixations)).toBe(2);
	});
});

describe('calculateRegressionCount', () => {
	function fixationsAt(...points: [number, number][]): FixationDataEntry[] {
		return points.map(([x, y]) => fixation({ eyetracker_x: x, eyetracker_y: y }));
	}

	it('counts a long leftward jump as a regression', () => {
		expect(calculateRegressionCount(fixationsAt([500, 100], [100, 100]))).toBe(1);
	});

	it('ignores rightward jumps', () => {
		expect(calculateRegressionCount(fixationsAt([100, 100], [500, 100]))).toBe(0);
	});

	it('ignores jumps shorter than the minimal distance', () => {
		expect(calculateRegressionCount(fixationsAt([100, 100], [51, 100]))).toBe(0);
	});

	it('counts a jump of exactly the minimal distance', () => {
		expect(calculateRegressionCount(fixationsAt([100, 100], [100, 150]))).toBe(1);
	});

	it('compares the angle against the threshold on both sides', () => {
		const angle = (deg: number): [number, number] => [
			100 + 200 * Math.cos((deg * Math.PI) / 180),
			100 + 200 * Math.sin((deg * Math.PI) / 180)
		];
		expect(calculateRegressionCount(fixationsAt([100, 100], angle(39.9)))).toBe(0);
		expect(calculateRegressionCount(fixationsAt([100, 100], angle(40.1)))).toBe(1);
		expect(calculateRegressionCount(fixationsAt([100, 100], angle(-39.9)))).toBe(0);
		expect(calculateRegressionCount(fixationsAt([100, 100], angle(-40.1)))).toBe(1);
	});

	it('counts each qualifying consecutive pair', () => {
		expect(
			calculateRegressionCount(fixationsAt([500, 100], [100, 100], [500, 100], [100, 100]))
		).toBe(2);
	});
});
