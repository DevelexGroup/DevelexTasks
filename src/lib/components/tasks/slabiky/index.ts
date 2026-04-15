import type {
	TaskMetadata,
	TrackTaskDataEntry,
	TrackTaskPreset,
	TrackTaskState
} from '$lib/types/task.types';
import type { SlabikyRawDataEntry } from '$lib/components/tasks/slabiky/slabiky.types';
import type { SessionScoreMetrics } from '$lib/database/db.types';
import { splitSequence } from '$lib/utils/trackLevelUtils';

export const addToList = true;
export const label = 'Slabiková stopa';
export const description = 'Example description';

// #region Presets
export const slabikyLevelPreset: TrackTaskPreset<SlabikyRawDataEntry> = [
	{
		levelID: '1',
		label: 'Úroveň 1',
		practiceContent: [{ generate: { type: 'practice' } }],
		content: [
			{ generate: { type: ['slabiky_1'] } },
			{ generate: { type: ['slabiky_4'] } },
			{ generate: { type: ['slabiky_7'] } },
			{ generate: { type: ['slabiky_7'] } },
			{ generate: { type: ['slabiky_2'] } },
			{ generate: { type: ['slabiky_5'] } },
			{ generate: { type: ['slabiky_8'] } },
			{ generate: { type: ['slabiky_8'] } },
			{ generate: { type: ['slabiky_3'] } },
			{ generate: { type: ['slabiky_6'] } },
			{ generate: { type: ['slabiky_9'] } },
			{ generate: { type: ['slabiky_9'] } }
		]
	},
	{
		levelID: '2',
		label: 'Úroveň 2',
		practiceContent: [{ generate: { type: 'practice' } }],
		content: [
			{ generate: { type: ['slabiky_1'] } },
			{ generate: { type: ['slabiky_4'] } },
			{ generate: { type: ['slabiky_7'] } },
			{ generate: { type: ['slabiky_7'] } },
			{ generate: { type: ['slabiky_2'] } },
			{ generate: { type: ['slabiky_5'] } },
			{ generate: { type: ['slabiky_8'] } },
			{ generate: { type: ['slabiky_8'] } },
			{ generate: { type: ['slabiky_3'] } },
			{ generate: { type: ['slabiky_6'] } },
			{ generate: { type: ['slabiky_9'] } },
			{ generate: { type: ['slabiky_9'] } }
		]
	}
];
// #endregion

// #region Scoring
const FLUENCY_MAX_SCORE = 100; // points

const FLUENCY_TIME_MIN = 4000; // ms
const FLUENCY_TIME_MAX = 9000; // ms
const FLUENCY_TARGET_REFIXATION_COUNT_PAR = 1; // fixations
const FLUENCY_FIXATION_COUNT_PAR_BASE = 5; // fixations

const FLUENCY_SCORE_TIME_MALUS = 45; // points
const FLUENCY_SCORE_MISTAKE_MALUS = 20; // points per mistake
const FLUENCY_SCORE_TARGET_REFIXATION_MALUS = 5; // points per refixation
const FLUENCY_SCORE_REGRESSION_MALUS = 2; // points per regression
const FLUENCY_SCORE_EXTRA_FIXATION_MALUS = 2; // points per extra fixation over par

export function calculateFluencyScore(
	scoreMetrics: Partial<SessionScoreMetrics>,
	state: TrackTaskState
): number {
	console.log('Calculating fluency score with metrics:', scoreMetrics);
	if (
		scoreMetrics.response_time === undefined ||
		scoreMetrics.error_rate === undefined ||
		scoreMetrics.aoi_target_fix === undefined ||
		scoreMetrics.regression_count === undefined ||
		scoreMetrics.fix_count === undefined
	) {
		return 0;
	}

	const timeMalus = -Math.max(
		0,
		Math.min(
			(scoreMetrics.response_time - FLUENCY_TIME_MIN) *
				(FLUENCY_SCORE_TIME_MALUS / (FLUENCY_TIME_MAX - FLUENCY_TIME_MIN)),
			FLUENCY_SCORE_TIME_MALUS
		)
	);
	const mistakeMalus = -(scoreMetrics.error_rate * FLUENCY_SCORE_MISTAKE_MALUS);
	const targetFixMalus = -Math.max(
		0,
		(scoreMetrics.aoi_target_fix - FLUENCY_TARGET_REFIXATION_COUNT_PAR) *
			FLUENCY_SCORE_TARGET_REFIXATION_MALUS
	);
	const regressionMalus = -(scoreMetrics.regression_count * FLUENCY_SCORE_REGRESSION_MALUS);
	const fixationCountMalus = -Math.max(
		0,
		(scoreMetrics.fix_count -
			(FLUENCY_FIXATION_COUNT_PAR_BASE + (state.dataEntry.correctCount ?? 1))) *
			FLUENCY_SCORE_EXTRA_FIXATION_MALUS
	);

	const score =
		timeMalus +
		mistakeMalus +
		targetFixMalus +
		regressionMalus +
		fixationCountMalus +
		FLUENCY_MAX_SCORE;

	return Math.max(0, Math.min(score, FLUENCY_MAX_SCORE)); // Clamp score between 0 and 100
}
// #endregion

// #region Data formatting
export function formatSlabikyRawData(rawData: SlabikyRawDataEntry): TrackTaskDataEntry {
	const correct = rawData.target_letter
		? rawData.target_letter.split('-').map((item) => item.trim())
		: undefined;

	let sequence: string[] | string[][];

	if (rawData.is_multirow) {
		// Split search_string into 5 equal-sized arrays
		const fullSequence = splitSequence(rawData.search_string, correct || [], true);
		const rowCount = 5;
		const itemsPerRow = Math.ceil(fullSequence.length / rowCount);

		sequence = [];
		for (let i = 0; i < rowCount; i++) {
			const start = i * itemsPerRow;
			const end = start + itemsPerRow;
			// @ts-expect-error fullSequence is string[]
			sequence.push(fullSequence.slice(start, end));
		}
	} else {
		sequence = splitSequence(rawData.search_string, correct || [], true);
	}

	const flatSequence = Array.isArray(sequence[0])
		? (sequence as string[][]).flat()
		: (sequence as string[]);
	const correctCount = flatSequence.filter((item) => correct?.includes(item)).length;

	return {
		id: rawData.id.toString(),
		sequence,
		correct,
		sound: correct?.length === 1 ? correct?.[0].toLowerCase() : correct?.join('').toLowerCase(),
		correctCount
	};
}
// #endregion

export const defaultPreset = slabikyLevelPreset;

export default {
	label,
	description,
	addToList,
	defaultPreset
} satisfies TaskMetadata;
