/**
 * Signal quality and device-clock timing of a gaze stream. No tracker reports its
 * nominal rate through the bridge, so the rate is measured from device timestamps,
 * the tracker's own clock. Bridge and main-thread stamps carry transport and
 * scheduling jitter and are never used here.
 */
export interface GazeSignalSummary {
	sampleCount: number;
	validSampleCount: number;
	/** Samples that carried a parseable device timestamp; the rate is measured over these. */
	timedSampleCount: number;
	measuredFrequencyHz: number | null;
	firstDeviceSampleAt: string | null;
	lastDeviceSampleAt: string | null;
}

/**
 * Sampling rate from the intervals between consecutive device timestamps, given
 * as interval → occurrence counts. The median interval is the typical period no
 * matter how many samples the tracker drops or how long it pauses; averaging the
 * intervals within half a period of it then cancels the millisecond rounding of
 * the timestamps. A span average reads low whenever samples are dropped, and a
 * plain median rounds 120 Hz to 125 and 150 Hz to 143.
 */
export function measureFrequencyHz(intervalCounts: Map<number, number>): number | null {
	const bins = [...intervalCounts].filter(([ms]) => ms > 0).sort((a, b) => a[0] - b[0]);
	const total = bins.reduce((sum, [, count]) => sum + count, 0);
	if (total === 0) return null;

	let seen = 0;
	let median = 0;
	for (const [ms, count] of bins) {
		seen += count;
		if (seen * 2 >= total) {
			median = ms;
			break;
		}
	}

	let kept = 0;
	let keptMs = 0;
	for (const [ms, count] of bins) {
		if (ms >= median / 2 && ms <= median * 1.5) {
			kept += count;
			keptMs += ms * count;
		}
	}
	const frequencyHz = Math.round((kept / keptMs) * 1000 * 10) / 10;
	return frequencyHz > 0 ? frequencyHz : null;
}

export class GazeSignalAccumulator {
	private sampleCount = 0;
	private validSampleCount = 0;
	private timedSampleCount = 0;
	private firstDeviceTimestamp: string | null = null;
	private lastDeviceTimestamp: string | null = null;
	private lastDeviceMs: number | null = null;
	private intervalCounts = new Map<number, number>();

	add(deviceTimestamp: string, valid: boolean) {
		this.sampleCount++;
		if (valid) this.validSampleCount++;

		const deviceMs = Date.parse(deviceTimestamp);
		if (Number.isNaN(deviceMs)) return;

		this.timedSampleCount++;
		this.firstDeviceTimestamp ??= deviceTimestamp;
		this.lastDeviceTimestamp = deviceTimestamp;
		if (this.lastDeviceMs !== null) {
			const interval = deviceMs - this.lastDeviceMs;
			this.intervalCounts.set(interval, (this.intervalCounts.get(interval) ?? 0) + 1);
		}
		this.lastDeviceMs = deviceMs;
	}

	summary(): GazeSignalSummary {
		return {
			sampleCount: this.sampleCount,
			validSampleCount: this.validSampleCount,
			timedSampleCount: this.timedSampleCount,
			measuredFrequencyHz: measureFrequencyHz(this.intervalCounts),
			firstDeviceSampleAt: this.firstDeviceTimestamp,
			lastDeviceSampleAt: this.lastDeviceTimestamp
		};
	}
}
