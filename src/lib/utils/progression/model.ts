import type { RawGazeDataEntry } from '$lib/database/db.types';
import type { I2mcFixationEntry } from '$lib/utils/csvParser';
import type { AoiRect } from '$lib/utils/sessionSim/types';
import { hitTest } from '$lib/utils/sessionSim/aoi/hitTest';

export const METRICS = {
	meanDuration: {
		label: 'Mean fixation duration',
		unit: 'ms',
		description: 'Average duration of the fixations on each recorded slide.'
	},
	count: {
		label: 'Fixation count',
		unit: '',
		description: 'Number of detected fixations on each recorded slide.'
	},
	medianDuration: {
		label: 'Median fixation duration',
		unit: 'ms',
		description: 'The middle fixation duration, less influenced by unusually long fixations.'
	},
	durationSd: {
		label: 'Fixation duration variability',
		unit: 'ms',
		description: 'Population standard deviation of fixation durations.'
	},
	totalDuration: {
		label: 'Total fixation time',
		unit: 'ms',
		description: 'Sum of all fixation durations on the slide.'
	},
	span: {
		label: 'Fixation span',
		unit: 'ms',
		description:
			'Elapsed time from the first fixation start to the last fixation end, including intervening gaps.'
	},
	backward: {
		label: 'Backward transitions',
		unit: '',
		description:
			'Observed transitions to an earlier word or syllable in reading order. Normal next-line movements are forward.'
	},
	firstVisit: {
		label: 'Mean first-visit fixation time',
		unit: 'ms',
		description: 'Average first-visit fixation time across visited words or syllables.'
	},
	revisits: {
		label: 'Revisit count',
		unit: '',
		description: 'Returns to a word or syllable after visiting another one.'
	},
	rereading: {
		label: 'Rereading fixation time',
		unit: 'ms',
		description: 'Total fixation time during observed return visits to words or syllables.'
	},
	dispersion: {
		label: 'Within-fixation variability',
		unit: 'px',
		description:
			'Mean sample-to-sample RMS displacement within fixations, calculated from valid raw gaze samples. Compare recordings made at the same resolution.'
	}
} as const;

export type MetricKey = keyof typeof METRICS;
export type MetricValues = Record<MetricKey, number | null>;
export type MetricReasons = Partial<Record<MetricKey, string>>;

export interface ProgressionSlide {
	slideIndex: number;
	stimulusId: string | null;
	seriesKey: string;
	label: string;
	source: 'saved' | 'calculated' | 'unavailable';
	values: MetricValues;
	reasons: MetricReasons;
	error?: string;
}

export interface ProgressionResult {
	sessionId: string;
	slides: ProgressionSlide[];
	warnings: string[];
	settingsDescription: string;
}

export const emptyMetrics = (): MetricValues =>
	Object.fromEntries(Object.keys(METRICS).map((key) => [key, null])) as MetricValues;

export const fixationEnd = (fixation: I2mcFixationEntry): number =>
	Number.isFinite(fixation.endTimestamp) && fixation.endTimestamp! >= fixation.timestamp
		? fixation.endTimestamp!
		: fixation.timestamp + fixation.duration;

const readingRegion = (id: string): { id: string; row: number; column: number } | null => {
	const match =
		/^(?:meantext-(?:content|practice)|pseudotext-(?:content|practice)|syllable)-(\d+)-(\d+)-/.exec(
			id
		);

	if (!match) {
		return null;
	}

	return { id, row: Number(match[1]), column: Number(match[2]) };
};

const resolveRegion = (fixation: I2mcFixationEntry, geometry: AoiRect[]) => {
	const ids = [...new Set(fixation.aoi.filter((id) => readingRegion(id)))];

	if (ids.length === 1) {
		return { region: readingRegion(ids[0]), ambiguous: false };
	}

	const matches = geometry.filter(
		(rect) =>
			readingRegion(rect.id) &&
			(ids.length === 0 || ids.includes(rect.id)) &&
			fixation.eyetracker_x !== null &&
			fixation.eyetracker_y !== null &&
			hitTest(
				fixation.eyetracker_x,
				fixation.eyetracker_y,
				{ ...rect, bufferSize: 0 },
				fixation.timestamp
			)
	);
	const distinct = [...new Set(matches.map((rect) => rect.id))];

	return {
		region: distinct.length === 1 ? readingRegion(distinct[0]) : null,
		ambiguous: distinct.length > 1 || (ids.length > 1 && distinct.length !== 1)
	};
};

const readingMetrics = (fixations: I2mcFixationEntry[], geometry: AoiRect[]) => {
	const resolved = fixations.map((fixation) => resolveRegion(fixation, geometry));

	if (!resolved.some(({ region }) => region) || resolved.some(({ ambiguous }) => ambiguous)) {
		return null;
	}

	const firstVisits = new Map<string, number>();
	let currentRegion: string | null = null;
	let returning = false;
	let backward = 0;
	let revisits = 0;
	let rereading = 0;
	let continuityLost = false;

	for (let i = 0; i < fixations.length; i++) {
		const fixation = fixations[i];
		const previous = fixations[i - 1];
		const region = resolved[i].region;
		const gap =
			previous &&
			(fixation.segment !== undefined && previous.segment !== undefined
				? fixation.segment !== previous.segment
				: fixation.timestamp - fixationEnd(previous) > 200);

		if (gap) {
			continuityLost = true;
			currentRegion = null;
		}

		if (!region) {
			continue;
		}

		if (continuityLost && firstVisits.has(region.id)) {
			return null;
		}

		if (region.id !== currentRegion) {
			returning = firstVisits.has(region.id);
			revisits += Number(returning);
			currentRegion = region.id;
			continuityLost = false;
		}

		const previousRegion = resolved[i - 1]?.region;

		if (
			!gap &&
			previousRegion &&
			(region.row < previousRegion.row ||
				(region.row === previousRegion.row && region.column < previousRegion.column))
		) {
			backward++;
		}

		if (returning) {
			rereading += fixation.duration;
		} else {
			firstVisits.set(region.id, (firstVisits.get(region.id) ?? 0) + fixation.duration);
		}
	}

	return {
		backward,
		revisits,
		rereading,
		firstVisit: [...firstVisits.values()].reduce((sum, value) => sum + value, 0) / firstVisits.size
	};
};

const samplePosition = (sample: RawGazeDataEntry): [number, number] | null => {
	const left = sample.validityL && Number.isFinite(sample.xL) && Number.isFinite(sample.yL);
	const right = sample.validityR && Number.isFinite(sample.xR) && Number.isFinite(sample.yR);

	if (left && right) {
		return [(sample.xL + sample.xR) / 2, (sample.yL + sample.yR) / 2];
	}

	if (left) {
		return [sample.xL, sample.yL];
	}

	if (right) {
		return [sample.xR, sample.yR];
	}

	return null;
};

export const calculateDispersion = (
	fixations: I2mcFixationEntry[],
	raw: RawGazeDataEntry[]
): number | null => {
	const samples = raw.slice().sort((a, b) => a.timestamp - b.timestamp);
	const differences = samples
		.slice(1)
		.map((sample, i) => sample.timestamp - samples[i].timestamp)
		.filter((delta) => delta > 0 && delta <= 200)
		.sort((a, b) => a - b);
	const step = differences[Math.floor(differences.length / 2)];

	if (!step) {
		return null;
	}

	const values: number[] = [];
	let start = 0;

	for (const fixation of fixations) {
		while (start < samples.length && samples[start].timestamp < fixation.timestamp) {
			start++;
		}

		let previous: { position: [number, number]; timestamp: number } | null = null;
		let sum = 0;
		let count = 0;

		for (let i = start; i < samples.length && samples[i].timestamp <= fixationEnd(fixation); i++) {
			const sample = samples[i];
			const position = samplePosition(sample);

			if (
				position &&
				previous &&
				sample.timestamp > previous.timestamp &&
				sample.timestamp - previous.timestamp <= Math.min(200, step * 1.5)
			) {
				sum +=
					(position[0] - previous.position[0]) ** 2 + (position[1] - previous.position[1]) ** 2;
				count++;
			}

			previous = position ? { position, timestamp: sample.timestamp } : null;
		}

		if (count > 0) {
			values.push(Math.sqrt(sum / count));
		}
	}

	return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
};

export const calculateMetrics = (
	input: I2mcFixationEntry[],
	raw: RawGazeDataEntry[] = [],
	geometry: AoiRect[] = []
): { values: MetricValues; reasons: MetricReasons } => {
	const fixations = input
		.filter(
			(fixation) =>
				Number.isFinite(fixation.timestamp) &&
				Number.isFinite(fixation.duration) &&
				fixation.duration > 0
		)
		.sort((a, b) => a.timestamp - b.timestamp);
	const values = emptyMetrics();
	const reasons: MetricReasons = {};
	values.count = fixations.length;
	values.totalDuration = fixations.reduce((sum, fixation) => sum + fixation.duration, 0);

	if (fixations.length) {
		const durations = fixations.map((fixation) => fixation.duration).sort((a, b) => a - b);
		const middle = Math.floor(durations.length / 2);
		values.meanDuration = values.totalDuration / durations.length;
		values.medianDuration =
			durations.length % 2 ? durations[middle] : (durations[middle - 1] + durations[middle]) / 2;
		values.durationSd = Math.sqrt(
			durations.reduce((sum, duration) => sum + (duration - values.meanDuration!) ** 2, 0) /
				durations.length
		);
		values.span =
			fixations.reduce((end, fixation) => Math.max(end, fixationEnd(fixation)), 0) -
			fixations[0].timestamp;
		values.dispersion = calculateDispersion(fixations, raw);
		const reading = readingMetrics(fixations, geometry);

		if (reading) {
			Object.assign(values, reading);
		}
	}

	for (const key of Object.keys(METRICS) as MetricKey[]) {
		if (values[key] === null) {
			reasons[key] =
				fixations.length === 0
					? 'No fixations were detected.'
					: key === 'dispersion'
						? 'Not enough consecutive valid raw gaze samples within fixation boundaries.'
						: 'Recorded reading regions are missing, ambiguous, or interrupted by a recording gap.';
		}
	}

	return { values, reasons };
};

export const assignSeries = (sessionId: string, slides: ProgressionSlide[]): ProgressionSlide[] => {
	const occurrences = new Map<string, number>();

	return slides
		.slice()
		.sort((a, b) => a.slideIndex - b.slideIndex)
		.map((slide) => {
			const id = slide.stimulusId;
			const occurrence = (occurrences.get(id ?? '') ?? 0) + 1;
			occurrences.set(id ?? '', occurrence);

			return {
				...slide,
				seriesKey: id
					? JSON.stringify([id, occurrence])
					: JSON.stringify([sessionId, slide.slideIndex]),
				label: id
					? `${id}${occurrence > 1 ? ` · occurrence ${occurrence}` : ''}`
					: `Unidentified stimulus · slide ${slide.slideIndex}`
			};
		});
};

export const formatMetric = (value: number | null, key: MetricKey): string =>
	value === null
		? 'Unavailable'
		: new Intl.NumberFormat('en-GB', { maximumFractionDigits: METRICS[key].unit ? 2 : 0 }).format(
				value
			);
