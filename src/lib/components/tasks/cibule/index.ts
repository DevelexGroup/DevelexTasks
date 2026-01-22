import type { TaskMetadata, TrackLevelState, TrackTaskPreset } from '$lib/types/task.types';
import { CibuleDataType } from '$lib/components/tasks/cibule/cibule.types';
import type { SessionScoreDataEntry, SessionScoreMetrics } from '$lib/database/db.types';

export const addToList = true;
export const label = 'Cibule';
export const description = 'Example description';

export const cibuleLevelPreset: TrackTaskPreset = [
	{
		levelID: 'level1',
		label: 'Úroveň 1',
		practiceContent: [
			{
				getRandomOfType: CibuleDataType.Pismena1
			}
		],
		content: [
			{
				getRandomOfType: [CibuleDataType.Pismena1, CibuleDataType.Pismena2]
			},
			{
				getRandomOfType: [CibuleDataType.Pismena1, CibuleDataType.Pismena2]
			},
			{
				getRandomOfType: [
					CibuleDataType.Slabiky21A,
					CibuleDataType.Slabiky21B,
					CibuleDataType.Slabiky21C
				]
			},
			{
				getRandomOfType: [CibuleDataType.Slabiky21D, CibuleDataType.Slabiky22]
			}
		]
	},
	{
		levelID: 'level2',
		label: 'Úroveň 2',
		practiceContent: [
			{
				getRandomOfType: CibuleDataType.Pismena1
			}
		],
		content: [
			{
				getRandomOfType: [CibuleDataType.Pismena1, CibuleDataType.Pismena2]
			},
			{
				getRandomOfType: [CibuleDataType.Pismena1, CibuleDataType.Pismena2]
			},
			{
				getRandomOfType: [
					CibuleDataType.Slabiky21A,
					CibuleDataType.Slabiky21B,
					CibuleDataType.Slabiky21C
				]
			},
			{
				getRandomOfType: [CibuleDataType.Slabiky21D, CibuleDataType.Slabiky22]
			}
		]
	},
	{
		levelID: 'level3a',
		label: 'Úroveň 3A',
		practiceContent: [
			{
				getRandomOfType: [CibuleDataType.Slova3Sl]
			}
		],
		content: [
			{
				getRandomOfType: [CibuleDataType.Slova3Sl]
			},
			{
				getRandomOfType: [CibuleDataType.Slova3Sl]
			},
			{
				getRandomOfType: [CibuleDataType.Slova4Sl]
			},
			{
				getRandomOfType: [CibuleDataType.Slova4Sl]
			}
		]
	},
	{
		levelID: 'level3b',
		label: 'Úroveň 3B',
		practiceContent: [
			{
				getRandomOfType: [CibuleDataType.Slova3Sl]
			}
		],
		content: [
			{
				getRandomOfType: [CibuleDataType.Slova3Sl]
			},
			{
				getRandomOfType: [CibuleDataType.Slova3Sl]
			},
			{
				getRandomOfType: [CibuleDataType.Slova4Sl]
			},
			{
				getRandomOfType: [CibuleDataType.Slova4Sl]
			}
		]
	}
];

const FLUENCY_MAX_SCORE = 100; // points

const FLUENCY_TIME_MIN = 2000; // ms
const FLUENCY_TIME_MAX = 5000; // ms
const FLUENCY_TARGET_REFIXATION_COUNT_PAR = 1; // fixations
const FLUENCY_FIXATION_COUNT_PAR_BASE = 5; // fixations

const FLUENCY_SCORE_TIME_MALUS = 45; // points
const FLUENCY_SCORE_MISTAKE_MALUS = 20; // points per mistake
const FLUENCY_SCORE_TARGET_REFIXATION_MALUS = 5; // points per refixation
const FLUENCY_SCORE_REGRESSION_MALUS = 2; // points per regression
const FLUENCY_SCORE_EXTRA_FIXATION_MALUS = 2; // points per extra fixation over par

export function calculateFluencyScore(scoreMetrics: Partial<SessionScoreMetrics>, state: TrackLevelState): number {
	console.log('Calculating fluency score with metrics:', scoreMetrics);
	if (scoreMetrics.response_time === undefined ||
		scoreMetrics.error_rate === undefined ||
		scoreMetrics.aoi_target_fix === undefined ||
		scoreMetrics.regression_count === undefined ||
		scoreMetrics.fix_count === undefined) {
		return 0;
	}

	const timeMalus = -Math.max(0, Math.min((scoreMetrics.response_time - FLUENCY_TIME_MIN) * (FLUENCY_SCORE_TIME_MALUS / (FLUENCY_TIME_MAX - FLUENCY_TIME_MIN)), FLUENCY_SCORE_TIME_MALUS));
	const mistakeMalus = -(scoreMetrics.error_rate * FLUENCY_SCORE_MISTAKE_MALUS);
	const targetFixMalus = -Math.max(0, (scoreMetrics.aoi_target_fix - FLUENCY_TARGET_REFIXATION_COUNT_PAR) * FLUENCY_SCORE_TARGET_REFIXATION_MALUS);
	const regressionMalus = -(scoreMetrics.regression_count * FLUENCY_SCORE_REGRESSION_MALUS);
	const fixationCountMalus = -Math.max(0, (scoreMetrics.fix_count - (FLUENCY_FIXATION_COUNT_PAR_BASE + (state.dataEntry.correctCount ?? 1))) * FLUENCY_SCORE_EXTRA_FIXATION_MALUS);

	const score = timeMalus +	mistakeMalus +targetFixMalus + regressionMalus + fixationCountMalus + FLUENCY_MAX_SCORE;

	return Math.max(0, Math.min(score, FLUENCY_MAX_SCORE)); // Clamp score between 0 and 100
}

export default {
	label,
	description,
	addToList
} satisfies TaskMetadata;
