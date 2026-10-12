import type { RawGazeDataEntry } from '$lib/database/db.types';
import type { I2mcFixationEntry } from '$lib/utils/csvParser';

export const METRICS = {
	meanDuration: {
		label: 'Průměrná délka fixace',
		unit: 'ms',
		description: 'Průměrná délka fixací na každém zaznamenaném snímku.'
	},
	count: {
		label: 'Počet fixací',
		unit: '',
		description: 'Počet detekovaných fixací na každém zaznamenaném snímku.'
	},
	medianDuration: {
		label: 'Medián délky fixace',
		unit: 'ms',
		description: 'Prostřední hodnota délky fixace, méně ovlivněná neobvykle dlouhými fixacemi.'
	},
	durationSd: {
		label: 'Variabilita délky fixace',
		unit: 'ms',
		description: 'Populační směrodatná odchylka délek fixací.'
	},
	totalDuration: {
		label: 'Celkový čas fixací',
		unit: 'ms',
		description: 'Součet délek všech fixací na snímku.'
	},
	span: {
		label: 'Časový rozsah fixací',
		unit: 'ms',
		description: 'Čas od začátku první fixace do konce poslední fixace včetně mezer mezi nimi.'
	},
	backward: {
		label: 'Zpětné přechody',
		unit: '',
		description:
			'Počet dvojic po sobě jdoucích fixací, u nichž je následující souřadnice X nižší. Shodné polohy X se nezapočítávají. Zahrnuje pohyby doleva na další řádek; nevyžaduje oblasti úlohy.'
	},
	dispersion: {
		label: 'Variabilita v rámci fixace',
		unit: 'px',
		description:
			'Průměrný RMS posun mezi vzorky v rámci fixací, vypočítaný z platných surových vzorků pohledu. Porovnávejte záznamy pořízené ve stejném rozlišení.'
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
	raw: RawGazeDataEntry[] = []
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
	values.backward = 0;
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
		let compared = 0;
		let skipped = 0;

		for (let i = 1; i < fixations.length; i++) {
			const previousX = fixations[i - 1].eyetracker_x;
			const nextX = fixations[i].eyetracker_x;

			if (
				previousX === null ||
				nextX === null ||
				!Number.isFinite(previousX) ||
				!Number.isFinite(nextX)
			) {
				skipped++;
				continue;
			}

			compared++;
			values.backward += Number(nextX < previousX);
		}

		if (skipped) {
			values.backward = compared ? values.backward : null;
			reasons.backward = `Porovnané dvojice po sobě jdoucích fixací: ${compared}; vynechané dvojice s chybějícími nebo neplatnými souřadnicemi X: ${skipped}.`;
		}
	}

	for (const key of Object.keys(METRICS) as MetricKey[]) {
		if (values[key] === null) {
			reasons[key] ??=
				fixations.length === 0
					? 'Nebyly detekovány žádné fixace.'
					: key === 'dispersion'
						? 'Nedostatek po sobě jdoucích platných surových vzorků pohledu v rámci fixací.'
						: 'Žádné dvojice po sobě jdoucích fixací s platnými souřadnicemi X.';
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
			label: `Snímek ${slide.slideIndex}`
		}));

export const formatMetric = (value: number | null, key: MetricKey): string =>
	value === null
		? 'Nedostupné'
		: new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: METRICS[key].unit ? 2 : 0 }).format(
				value
			);
