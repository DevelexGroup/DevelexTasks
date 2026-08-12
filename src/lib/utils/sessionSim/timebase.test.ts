import { describe, expect, it } from 'vitest';
import type { RawGazeDataEntry } from '$lib/database/db.types';
import { rebaseOnBridgeClock } from './timebase';

function row(timestamp: number, bridgeMs: number | null): RawGazeDataEntry {
	return {
		child_id: 'child',
		session_id: 'session',
		task_name: 'cibule-1',
		slide_index: 1,
		timestamp,
		bridgeTimeStamp: bridgeMs === null ? 'invalid' : new Date(bridgeMs).toISOString(),
		deviceTimeStamp: '1970-01-01T00:00:00.000Z',
		x: 0,
		y: 0,
		xL: 0,
		yL: 0,
		validityL: true,
		pupilDiameterL: 3,
		xR: 0,
		yR: 0,
		validityR: true,
		pupilDiameterR: 3
	};
}

describe('rebaseOnBridgeClock', () => {
	it('spreads a stall-burst back to bridge spacing, keeping the calm offset', () => {
		// Calm rows run 6 ms behind bridge; then the main thread stalls and
		// flushes three samples at once.
		const rows = [
			row(1006, 1000),
			row(1010, 1004),
			row(1014, 1008),
			row(1160, 1012),
			row(1161, 1016),
			row(1161, 1020)
		];
		const result = rebaseOnBridgeClock(rows);
		expect(result.offsetMs).toBe(6);
		expect(result.rows.map((r) => r.timestamp)).toEqual([1006, 1010, 1014, 1018, 1022, 1026]);
		expect(result.skipped).toBe(0);
	});

	it('leaves rows without a parseable bridge time unchanged', () => {
		const rows = [row(1006, 1000), row(1010, null), row(1014, 1008)];
		const result = rebaseOnBridgeClock(rows);
		expect(result.rows[1].timestamp).toBe(1010);
		expect(result.skipped).toBe(1);
	});

	it('returns copies untouched when no bridge times parse', () => {
		const rows = [row(100, null), row(200, null)];
		const result = rebaseOnBridgeClock(rows);
		expect(result.rows.map((r) => r.timestamp)).toEqual([100, 200]);
		expect(result.skipped).toBe(2);
		expect(result.rows[0]).not.toBe(rows[0]);
	});
});
