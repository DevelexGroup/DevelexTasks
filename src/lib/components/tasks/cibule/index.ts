import type {
	TaskMetadata,
	TrackTaskState,
	TrackTaskPreset,
	TrackTaskDataEntry
} from '$lib/types/task.types';
import { CibuleDataType, type CibuleRawDataEntry } from '$lib/components/tasks/cibule/cibule.types';
import type { SessionScoreMetrics } from '$lib/database/db.types';
import { splitSequence } from '$lib/utils/trackLevelUtils';

export const addToList = true;
export const label = 'Řádkový lov';
export const description = 'Example description';

// #region Presets
export const cibuleLevelPreset: TrackTaskPreset<CibuleRawDataEntry> = [
	{
		levelID: '1',
		label: 'Úroveň 1',
		practiceContent: [
			{
				generate: {
					type: [CibuleDataType.Pismena0]
				}
			}
		],
		content: [
			{
				generate: {
					type: [CibuleDataType.Pismena1]
				}
			},
			{
				generate: {
					type: [CibuleDataType.Pismena2]
				}
			},
			{
				generate: {
					type: [CibuleDataType.Slabiky1]
				}
			},
			{
				generate: {
					type: [CibuleDataType.Slabiky2]
				}
			}
		]
	},
	{
		levelID: '2',
		label: 'Úroveň 2',
		practiceContent: [
			{
				generate: {
					type: [CibuleDataType.Pismena0]
				}
			}
		],
		content: [
			{
				generate: {
					type: [CibuleDataType.Pismena1]
				}
			},
			{
				generate: {
					type: [CibuleDataType.Pismena2]
				}
			},
			{
				generate: {
					type: [CibuleDataType.Slabiky1]
				}
			},
			{
				generate: {
					type: [CibuleDataType.Slabiky2]
				}
			}
		]
	},
	{
		levelID: '3',
		label: 'Úroveň 3',
		practiceContent: [
			{
				generate: {
					type: [CibuleDataType.Slova1Sl3]
				}
			}
		],
		content: [
			{
				generate: {
					type: [CibuleDataType.Slova1Sl3]
				}
			},
			{
				generate: {
					type: [CibuleDataType.Slova1Sl3]
				}
			},
			{
				generate: {
					type: [CibuleDataType.Slova1Sl4]
				}
			},
			{
				generate: {
					type: [CibuleDataType.Slova1Sl4]
				}
			}
		]
	},
	{
		levelID: '4',
		label: 'Úroveň 4',
		practiceContent: [
			{
				generate: {
					type: [CibuleDataType.Slova2Sl3]
				}
			}
		],
		content: [
			{
				generate: {
					type: [CibuleDataType.Slova2Sl3]
				}
			},
			{
				generate: {
					type: [CibuleDataType.Slova2Sl3]
				}
			},
			{
				generate: {
					type: [CibuleDataType.Slova2Sl4]
				}
			},
			{
				generate: {
					type: [CibuleDataType.Slova2Sl4]
				}
			}
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
export function formatCibuleRawData(rawData: CibuleRawDataEntry): TrackTaskDataEntry {
	const correct = rawData.target_letter
		? rawData.target_letter.split('-').map((item) => item.trim())
		: undefined;
	const sequence = splitSequence(rawData.search_string, correct || []);
	const correctCount = sequence.filter((item) => correct?.includes(item)).length;
	return {
		id: rawData.id.toString(),
		sequence,
		correct,
		sound: correct?.length === 1 ? correct?.[0].toLowerCase() : correct?.join('').toLowerCase(),
		correctCount
	};
}
// #endregion

export const defaultPreset = cibuleLevelPreset;

export default {
	label,
	description,
	addToList,
	defaultPreset
} satisfies TaskMetadata;
