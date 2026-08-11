import type { FixationDataEntry, GazeSampleDataEntry } from '$lib/database/db.types';

export interface SlideTimeWindow {
	slideIndex: number;
	startTime: number;
	endTime: number;
}

export const REGRESSION_MIN_DIST = 50; // pixels
export const REGRESSION_MIN_DEGREE = 40; // degrees

export function getEffectiveTimeWindow(
	gazeSamples: GazeSampleDataEntry[],
	slideIndex: number
): SlideTimeWindow | null {
	let startTime: number | null = null;
	let endTime: number | null = null;

	for (const sample of gazeSamples) {
		if (!sample.events) continue;

		for (const event of sample.events) {
			// Check for slide start event (dwell-finish_slide-{index}_initial)
			if (startTime === null && event === `dwell-finish_slide-${slideIndex}_initial`) {
				startTime = sample.timestamp;
				continue;
			}

			// Check for slide complete event (complete-slide-{index})
			if (startTime !== null && event === `complete-slide-${slideIndex}`) {
				endTime = sample.timestamp;
				return { slideIndex, startTime, endTime };
			}
		}
	}

	console.error(
		`No complete event found for slide index ${slideIndex} (startTime: ${startTime}, endTime: ${endTime})`
	);
	return null;
}

export function getEffectiveTimeWindows(gazeSamples: GazeSampleDataEntry[]): SlideTimeWindow[] {
	const timeWindows: SlideTimeWindow[] = [];
	let pendingStartTime: number | null = null;

	for (const sample of gazeSamples) {
		if (!sample.events) continue;

		for (const event of sample.events) {
			// Check for slide start event (dwell-finish_slide-{index}_initial)
			if (
				pendingStartTime === null &&
				event.startsWith('dwell-finish_slide-') &&
				event.endsWith('_initial')
			) {
				pendingStartTime = sample.timestamp;
				continue;
			}

			// Check for slide complete event (complete-slide-{index})
			if (pendingStartTime !== null && event.startsWith('complete-slide-')) {
				timeWindows.push({
					slideIndex: timeWindows.length,
					startTime: pendingStartTime,
					endTime: sample.timestamp
				});
				pendingStartTime = null;
			}
		}
	}

	return timeWindows;
}

export function filterSamplesInWindow(
	gazeSamples: GazeSampleDataEntry[],
	window: SlideTimeWindow
): GazeSampleDataEntry[] {
	return gazeSamples.filter(
		(sample) => sample.timestamp >= window.startTime && sample.timestamp <= window.endTime
	);
}

// Fixation timestamps mark their start time
export function filterFixationsInWindow(
	fixationData: FixationDataEntry[],
	window: SlideTimeWindow
): FixationDataEntry[] {
	return fixationData.filter(
		(fix) => fix.timestamp >= window.startTime && fix.timestamp <= window.endTime
	);
}

export function calculateErrorRate(gazeSamples: GazeSampleDataEntry[]): number {
	// sum of all mistakes of type "misclick", "skipped" and "wrong-order"
	return gazeSamples.reduce((count, sample) => {
		const mistakes = sample.mistake_type || [];
		mistakes.forEach((mistake) => {
			if (mistake === 'misclick' || mistake === 'skipped' || mistake === 'wrong-order') {
				count++;
			}
		});
		return count;
	}, 0);
}

export function calculateResponseTime(gazeSamples: GazeSampleDataEntry[]): number {
	if (gazeSamples.length === 0) return 0;
	const startTime = gazeSamples[0].timestamp;
	const endTime = gazeSamples[gazeSamples.length - 1].timestamp;
	return endTime - startTime;
}

export function calculateMeanFixationDuration(fixationData: FixationDataEntry[]): number {
	if (fixationData.length === 0) return 0;
	const totalDuration = fixationData.reduce((sum, fix) => sum + fix.duration, 0);
	return totalDuration / fixationData.length;
}

export function calculateAOITargetFixations(fixationData: FixationDataEntry[]): number {
	return fixationData.filter((fix) => fix.aoi.includes('hint')).length;
}

export function calculateAOIFieldFixations(fixationData: FixationDataEntry[]): number {
	return fixationData.filter((fix) => fix.aoi.includes('track')).length;
}

export function calculateRegressionCount(fixationData: FixationDataEntry[]): number {
	// Count two consecutive fixations as a regression if:
	// 1) The distance between them is greater than REGRESSION_MIN_DIST
	// 2) The angle between them is greater than +- REGRESSION_MIN_DEGREE (0 degrees is rightwards)
	let regressionCount = 0;
	for (let i = 1; i < fixationData.length; i++) {
		const prevFix = fixationData[i - 1];
		const currFix = fixationData[i];

		const deltaX = currFix.eyetracker_x! - prevFix.eyetracker_x!;
		const deltaY = currFix.eyetracker_y! - prevFix.eyetracker_y!;
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

		if (distance < REGRESSION_MIN_DIST) continue;

		const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;

		if (angle > REGRESSION_MIN_DEGREE || angle < -REGRESSION_MIN_DEGREE) {
			regressionCount++;
		}
	}
	return regressionCount;
}
