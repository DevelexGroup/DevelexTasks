import { describe, expect, it } from 'vitest';
import type { GazeSampleDataEntry, RawGazeDataEntry } from '$lib/database/db.types';
import { runReplay } from './replay';
import { identityCorrection } from './transform';
import {
	defaultReplayOptions,
	type LoadedSession,
	type SlideCorrectionMap,
	type SlideGeometry
} from './types';

const BASE_MS = Date.parse('2024-08-11T12:00:00.000Z');

function rawAt(offsetMs: number, x: number, y: number): RawGazeDataEntry {
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
		validityL: true,
		pupilDiameterL: 3,
		xR: x,
		yR: y,
		validityR: true,
		pupilDiameterR: 3
	};
}

function rowAt(
	offsetMs: number,
	x: number | null,
	y: number | null,
	overrides: Partial<GazeSampleDataEntry> = {}
): GazeSampleDataEntry {
	return {
		child_id: 'child',
		session_id: 'session',
		task_name: 'cibule-1',
		slide_index: 1,
		stimulus_id: '5',
		timestamp: BASE_MS + offsetMs,
		device_timestamp: new Date(BASE_MS + offsetMs).toISOString(),
		eyetracker_x: x,
		eyetracker_y: y,
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

// One slide: a 200 ms fixation at (100,100) inside 'track', a saccade to
// (400,100) inside 'hint', and a trailing unfinished fixation there.
function buildSession(): LoadedSession {
	const rawGazeData: RawGazeDataEntry[] = [];
	for (let t = 0; t <= 200; t += 10) rawGazeData.push(rawAt(t, 100, 100));
	for (let t = 210; t <= 500; t += 10) rawGazeData.push(rawAt(t, 400, 100));

	const gazeSamples: GazeSampleDataEntry[] = [rowAt(-20, null, null, { aoi: ['stale'] })];
	for (let t = 0; t <= 500; t += 10) {
		const x = t <= 200 ? 100 : 400;
		gazeSamples.push(
			rowAt(t, x, 100, {
				events: t === 0 ? ['dwell-finish_slide-1_initial'] : t === 500 ? ['complete-slide-1'] : []
			})
		);
	}

	return {
		childId: 'child',
		sessionId: 'session',
		taskName: 'cibule-1',
		gazeSamples,
		fixationData: [],
		sessionScores: [],
		rawGazeData,
		maxSlides: 1,
		warnings: []
	};
}

function buildGeometry(): Map<number, SlideGeometry> {
	return new Map([
		[
			1,
			{
				slideIndex: 1,
				stimulusId: '5',
				viewport: { width: 1920, height: 1080 },
				approximate: false,
				aois: [
					{ id: 'track', left: 50, top: 50, right: 150, bottom: 150, bufferSize: 0 },
					{ id: 'hint', left: 350, top: 50, right: 450, bottom: 150, bufferSize: 0 }
				]
			}
		]
	]);
}

function noCorrections(): SlideCorrectionMap {
	return { sessionDefault: identityCorrection(), perSlide: new Map() };
}

describe('runReplay', () => {
	it('reproduces fixations, AOI sets and scores with zero correction', () => {
		const result = runReplay({
			session: buildSession(),
			corrections: noCorrections(),
			geometryBySlide: buildGeometry(),
			options: defaultReplayOptions(),
			fluency: (metrics, stimulusId) => (stimulusId === '5' ? 42 : -1)
		});

		expect(result.warnings).toEqual([]);

		// The trailing unfinished fixation is dropped by default
		expect(result.fixations).toHaveLength(1);
		const fixation = result.fixations[0];
		expect(fixation.timestamp).toBe(BASE_MS + 100);
		expect(fixation.slide_index).toBe(1);
		expect(fixation.stimulus_id).toBe('5');
		expect(fixation.eyetracker_x).toBeCloseTo(100, 0);
		expect(fixation.aoi).toEqual(['track']);
		expect(fixation.duration).toBeGreaterThanOrEqual(100);
		expect(fixation.duration).toBeLessThanOrEqual(200);

		// Regenerated samples: events/timestamps preserved, AOI recomputed in window
		const regenerated = result.gazeSamples;
		expect(regenerated).toHaveLength(buildSession().gazeSamples.length);
		expect(regenerated[0].aoi).toEqual(['stale']);
		const atStart = regenerated.find((row) => row.timestamp === BASE_MS)!;
		expect(atStart.aoi).toEqual(['track']);
		expect(atStart.events).toEqual(['dwell-finish_slide-1_initial']);
		const late = regenerated.find((row) => row.timestamp === BASE_MS + 300)!;
		expect(late.aoi).toEqual(['hint']);

		// Scores per live per-slide semantics
		expect(result.sessionScores).toHaveLength(1);
		const score = result.sessionScores[0];
		expect(score.slide_index).toBe(1);
		expect(score.timestamp).toBe(BASE_MS + 500);
		expect(score.stimulus_id).toBe('5');
		expect(score.fix_count).toBe(1);
		expect(score.aoi_field_fix).toBe(1);
		expect(score.aoi_target_fix).toBe(0);
		expect(score.response_time).toBe(500);
		expect(score.error_rate).toBe(0);
		expect(score.mean_fix_dur).toBe(fixation.duration);
		expect(score.fluency_score).toBe(42);

		expect(result.perSlide.get(1)?.fixations).toHaveLength(1);
	});

	it('keeps the trailing fixation when dropUnfinishedFinalFixation is off', () => {
		const options = { ...defaultReplayOptions(), dropUnfinishedFinalFixation: false };
		const result = runReplay({
			session: buildSession(),
			corrections: noCorrections(),
			geometryBySlide: buildGeometry(),
			options
		});

		expect(result.fixations).toHaveLength(2);
		const trailing = result.fixations[1];
		expect(trailing.aoi).toEqual(['hint']);
		expect(trailing.duration).toBeGreaterThanOrEqual(200);
	});

	it('applies a session-wide offset: fixations shift and AOI hits flip', () => {
		const corrections: SlideCorrectionMap = {
			sessionDefault: { ...identityCorrection(), offsetX: 300 },
			perSlide: new Map()
		};
		const result = runReplay({
			session: buildSession(),
			corrections,
			geometryBySlide: buildGeometry(),
			options: defaultReplayOptions()
		});

		const fixation = result.fixations[0];
		expect(fixation.eyetracker_x).toBeCloseTo(400, 0);
		expect(fixation.aoi).toEqual(['hint']);

		const atStart = result.gazeSamples.find((row) => row.timestamp === BASE_MS)!;
		expect(atStart.eyetracker_x).toBe(400);
		expect(atStart.aoi).toEqual(['hint']);
		// Beyond both AOIs after the shift
		const late = result.gazeSamples.find((row) => row.timestamp === BASE_MS + 300)!;
		expect(late.aoi).toEqual([]);

		expect(result.rawGazeData[0].x).toBe(400);
		expect(result.sessionScores[0].aoi_target_fix).toBe(1);
		expect(result.sessionScores[0].aoi_field_fix).toBe(0);
	});

	it('warns and preserves recorded AOI when slide geometry is missing', () => {
		const result = runReplay({
			session: buildSession(),
			corrections: noCorrections(),
			geometryBySlide: new Map(),
			options: defaultReplayOptions()
		});

		expect(result.warnings.some((w) => w.includes('no AOI geometry'))).toBe(true);
		const atStart = result.gazeSamples.find((row) => row.timestamp === BASE_MS)!;
		expect(atStart.aoi).toEqual([]);
		expect(result.fixations[0].aoi).toEqual([]);
	});

	it('runs a fixation post-processor stage', () => {
		const options = defaultReplayOptions();
		options.postProcessors = [
			{
				name: 'drop-short',
				apply: (fixations) => fixations.filter((f) => f.duration >= 1000)
			}
		];
		const result = runReplay({
			session: buildSession(),
			corrections: noCorrections(),
			geometryBySlide: buildGeometry(),
			options
		});

		expect(result.fixations).toHaveLength(0);
		expect(result.sessionScores[0].fix_count).toBe(0);
	});
});
