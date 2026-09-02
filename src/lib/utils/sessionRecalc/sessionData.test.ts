import { describe, expect, it } from 'vitest';
import type { RawGazeDataEntry } from '$lib/database/db.types';
import { outsideViewportShare } from './sessionData';

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

describe('outsideViewportShare', () => {
	const viewport = { width: 1920, height: 1080 };

	it('reports the share of valid points outside the viewport', () => {
		const rows = [
			rawEntry(),
			rawEntry({ x: 2000 }),
			rawEntry({ y: -5 }),
			rawEntry({ x: 1920, y: 1080 })
		];
		expect(outsideViewportShare(rows, viewport)).toBe(0.5);
	});

	it('ignores invalid samples and handles empty data', () => {
		const rows = [rawEntry({ x: 9999, validityL: false, validityR: false }), rawEntry()];
		expect(outsideViewportShare(rows, viewport)).toBe(0);
		expect(outsideViewportShare([], viewport)).toBe(0);
	});
});
