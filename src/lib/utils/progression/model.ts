import type { GazeSampleDataEntry, RawGazeDataEntry } from '$lib/database/db.types';
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
			'Observed transitions to an earlier word, syllable, or symbol group in task order. Normal next-line movements are forward.'
	},
	firstVisit: {
		label: 'Mean first-visit fixation time',
		unit: 'ms',
		description:
			'Average observed first-visit fixation time across identified words, syllables, or symbol groups.'
	},
	revisits: {
		label: 'Revisit count',
		unit: '',
		description:
			'Observed returns to an identified word, syllable, or symbol group after visiting another one.'
	},
	rereading: {
		label: 'Return-visit fixation time',
		unit: 'ms',
		description:
			'Total fixation time during observed return visits to words, syllables, or symbol groups.'
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

const orderedRegion = (id: string): { id: string; row: number; column: number } | null => {
	const match =
		/^(?:meantext-(?:content|practice)|pseudotext-(?:content|practice)|syllable)-(\d+)-(\d+)-/.exec(
			id
		);

	if (match) {
		return { id, row: Number(match[1]), column: Number(match[2]) };
	}

	const group = /^(?:target-)?group-(\d+)$/.exec(id);

	return group ? { id, row: 0, column: Number(group[1]) } : null;
};

const resolveRegion = (fixation: I2mcFixationEntry, geometry: AoiRect[]) => {
	const ids = [...new Set(fixation.aoi.filter((id) => orderedRegion(id)))];

	if (ids.length === 1) {
		return { region: orderedRegion(ids[0]), ambiguous: false };
	}

	const matches = geometry.filter(
		(rect) =>
			orderedRegion(rect.id) &&
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
		region: distinct.length === 1 ? orderedRegion(distinct[0]) : null,
		ambiguous: distinct.length > 1 || (ids.length > 1 && distinct.length !== 1)
	};
};

const regionMetrics = (
	fixations: I2mcFixationEntry[],
	geometry: AoiRect[],
	gazeSamples: GazeSampleDataEntry[]
) => {
	const samples = gazeSamples.slice().sort((a, b) => a.timestamp - b.timestamp);
	let sampleStart = 0;
	let recovered = 0;
	let matchedSamples = 0;
	let ambiguousFixations = 0;
	const resolved = fixations.map((fixation) => {
		const assignment = resolveRegion(fixation, geometry);
		const direct = assignment.region;
		ambiguousFixations += Number(assignment.ambiguous);

		if (direct) {
			return direct;
		}

		while (sampleStart < samples.length && samples[sampleStart].timestamp < fixation.timestamp) {
			sampleStart++;
		}

		const votes = new Map<string, number>();
		let total = 0;
		let lastTimestamp: number | undefined;

		for (
			let i = sampleStart;
			i < samples.length && samples[i].timestamp <= fixationEnd(fixation);
			i++
		) {
			const sample = samples[i];

			if (
				sample.slide_index !== fixation.slide_index ||
				sample.timestamp === lastTimestamp ||
				!Number.isFinite(sample.eyetracker_x) ||
				!Number.isFinite(sample.eyetracker_y)
			) {
				continue;
			}

			lastTimestamp = sample.timestamp;
			total++;
			matchedSamples++;
			const ids = [...new Set(sample.aoi.filter((id) => orderedRegion(id)))];

			if (ids.length === 1) {
				votes.set(ids[0], (votes.get(ids[0]) ?? 0) + 1);
			}
		}

		const majority = [...votes].find(([, count]) => count >= 2 && count > total / 2);

		if (majority) {
			recovered++;

			return orderedRegion(majority[0]);
		}

		return null;
	});
	const identified = resolved.filter((region) => region !== null).length;

	if (!identified) {
		const labels = new Set<string>();
		let labeledFixations = 0;
		let labeledSamples = 0;

		for (const fixation of fixations) {
			labeledFixations += Number(fixation.aoi.some((id) => orderedRegion(id)));

			for (const id of fixation.aoi) {
				labels.add(id);
			}
		}

		for (const sample of samples) {
			labeledSamples += Number(sample.aoi.some((id) => orderedRegion(id)));

			for (const id of sample.aoi) {
				labels.add(id);
			}
		}

		for (const rect of geometry) {
			labels.add(rect.id);
		}

		const regionCount = new Set(
			geometry.filter((rect) => orderedRegion(rect.id)).map((rect) => rect.id)
		).size;
		const explanation =
			labeledFixations || labeledSamples || regionCount
				? 'Task regions were recorded, but no fixation could be assigned uniquely. Overlapping labels need usable recorded geometry or unambiguous gaze samples within fixation times.'
				: 'No supported item regions were found. Word, syllable, or symbol-group regions are required; track and hint alone are insufficient.';
		const examples =
			[...labels]
				.slice(0, 6)
				.map((id) => id.slice(0, 80))
				.join(', ') || 'none';

		return {
			values: null,
			note: `${explanation} Recording details: ${labeledFixations}/${fixations.length} fixations with supported labels; ${ambiguousFixations} ambiguous fixations; ${regionCount} item regions in geometry; ${labeledSamples}/${samples.length} gaze samples with supported labels; ${matchedSamples} valid gaze samples within fixation times. Region IDs: ${examples}${labels.size > 6 ? ', …' : ''}.`
		};
	}

	const firstVisits = new Map<string, number>();
	let currentRegion: string | null = null;
	let returning: boolean | null = null;
	let backward = 0;
	let revisits = 0;
	let rereading = 0;
	let gaps = 0;

	for (let i = 0; i < fixations.length; i++) {
		const fixation = fixations[i];
		const previous = fixations[i - 1];
		const region = resolved[i];
		const gap =
			previous &&
			(fixation.segment !== undefined && previous.segment !== undefined
				? fixation.segment !== previous.segment
				: fixation.timestamp - fixationEnd(previous) > 200);

		if (gap) {
			gaps++;
			currentRegion = null;
		}

		if (!region) {
			currentRegion = null;
			returning = null;
			continue;
		}

		if (region.id !== currentRegion) {
			returning = firstVisits.has(region.id) ? (currentRegion !== null ? true : null) : false;
			revisits += Number(returning === true);
			currentRegion = region.id;
		}

		const previousRegion = resolved[i - 1];

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
		} else if (returning === false) {
			firstVisits.set(region.id, (firstVisits.get(region.id) ?? 0) + fixation.duration);
		}
	}

	const notes: string[] = [];

	if (identified < fixations.length || gaps) {
		notes.push(
			`Partial region metrics: ${identified} of ${fixations.length} fixations have identifiable task regions. Unassigned fixations and recording gaps break visit continuity; only observed transitions and visit durations are included.`
		);
	}

	if (recovered) {
		notes.push(
			`Task regions for ${recovered} fixations were recovered from recorded gaze samples.`
		);
	}

	return {
		values: {
			backward,
			revisits,
			rereading,
			firstVisit:
				[...firstVisits.values()].reduce((sum, value) => sum + value, 0) / firstVisits.size
		},
		note: notes.join(' ')
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
	geometry: AoiRect[] = [],
	gazeSamples: GazeSampleDataEntry[] = []
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
		const regions = regionMetrics(fixations, geometry, gazeSamples);

		if (regions.values) {
			Object.assign(values, regions.values);
		}

		if (regions.note) {
			for (const key of ['backward', 'revisits', 'rereading', 'firstVisit'] as const) {
				reasons[key] = regions.note;
			}
		}
	}

	for (const key of Object.keys(METRICS) as MetricKey[]) {
		if (values[key] === null) {
			reasons[key] ??=
				fixations.length === 0
					? 'No fixations were detected.'
					: key === 'dispersion'
						? 'Not enough consecutive valid raw gaze samples within fixation boundaries.'
						: 'No ordered task regions could be identified. These metrics need recorded word, syllable, or symbol-group regions; track and hint regions alone are not sufficient.';
		}
	}

	return { values, reasons };
};

export const assignSeries = (slides: ProgressionSlide[]): ProgressionSlide[] =>
	slides
		.slice()
		.sort((a, b) => a.slideIndex - b.slideIndex)
		.map((slide) => ({
			...slide,
			seriesKey: `slide:${slide.slideIndex}`,
			label: `Slide ${slide.slideIndex}`
		}));

export const formatMetric = (value: number | null, key: MetricKey): string =>
	value === null
		? 'Unavailable'
		: new Intl.NumberFormat('en-GB', { maximumFractionDigits: METRICS[key].unit ? 2 : 0 }).format(
				value
			);
