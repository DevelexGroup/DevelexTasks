import type { RawGazeDataEntry } from '$lib/database/db.types';

export interface RebaseResult {
	rows: RawGazeDataEntry[];
	offsetMs: number;
	skipped: number;
}

/**
 * Recorded main-thread timestamps arrive late and in bursts whenever the tab
 * is busy, while the bridge clock ticks with the tracker. Re-stamps each
 * sample with its bridge time shifted by the calm (timestamp − bridge) offset,
 * so the result stays in the clock frame of the event markers. Stamping delay
 * is one-sided (main only ever stamps late), so a low percentile of the diff
 * estimates the calm offset robustly. Samples without a parseable bridge time
 * are left unchanged.
 */
export function rebaseOnBridgeClock(rows: RawGazeDataEntry[]): RebaseResult {
	const bridgeMs = rows.map((row) => Date.parse(row.bridgeTimeStamp));
	const diffs: number[] = [];
	for (let i = 0; i < rows.length; i++) {
		if (!Number.isNaN(bridgeMs[i])) diffs.push(rows[i].timestamp - bridgeMs[i]);
	}
	if (diffs.length === 0)
		return { rows: rows.map((row) => ({ ...row })), offsetMs: 0, skipped: rows.length };

	diffs.sort((a, b) => a - b);
	const offsetMs = diffs[Math.floor(diffs.length * 0.1)];

	let skipped = 0;
	const result = rows.map((row, i) => {
		if (Number.isNaN(bridgeMs[i])) {
			skipped++;
			return { ...row };
		}
		return { ...row, timestamp: bridgeMs[i] + offsetMs };
	});
	return { rows: result, offsetMs, skipped };
}
