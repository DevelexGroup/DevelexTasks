import type {
	TaskMetadata,
	TaskMistake,
	TrackTaskDataEntry, TrackTaskPreset,
	TrackTaskState
} from '$lib/types/task.types';
import { MistakeMisclick, MistakeUnfinished } from '$lib/types/mistakes.types';
import { getFlattenedSymbols } from '$lib/utils/trackLevelUtils';
import type { FonologieAudioRawDataEntry } from '$lib/components/tasks/fonologie/fonologie.types';

export const addToList = true;
export const label = 'Fonologie';
export const description = 'Example description';

// #region Presets
export const fonologieLevelPreset: TrackTaskPreset<FonologieAudioRawDataEntry> = [
	{
		levelID: 'level1',
		label: 'Úroveň 1',
		practiceContent: [
			{ generate: { level: 'level1'	} }
		],
		content: [
			{ generate: { level: 'level1'	} },
			{ generate: { level: 'level1'	} },
			{ generate: { level: 'level1'	} },
			{ generate: { level: 'level1'	} },
			{ generate: { level: 'level1'	} }
		]
	},
	{
		levelID: 'level2',
		label: 'Úroveň 2',
		practiceContent: [
			{ generate: { level: 'level2'	} }
		],
		content: [
			{ generate: { level: 'level2'	} },
			{ generate: { level: 'level2'	} },
			{ generate: { level: 'level2'	} },
			{ generate: { level: 'level2'	} },
			{ generate: { level: 'level2'	} }
		]
	},
	{
		levelID: 'level3',
		label: 'Úroveň 3',
		practiceContent: [
			{ generate: { level: 'level3'	} }
		],
		content: [
			{ generate: { level: 'level3'	} },
			{ generate: { level: 'level3'	} },
			{ generate: { level: 'level3'	} },
			{ generate: { level: 'level3'	} },
			{ generate: { level: 'level3'	} }
		]
	},
	{
		levelID: 'level4',
		label: 'Úroveň 4',
		practiceContent: [
			{ generate: { level: 'level4'	} }
		],
		content: [
			{ generate: { level: 'level4'	} },
			{ generate: { level: 'level4'	} },
			{ generate: { level: 'level4'	} },
			{ generate: { level: 'level4'	} },
			{ generate: { level: 'level4'	} }
		]
	},
	{
		levelID: 'level5',
		label: 'Úroveň 5',
		practiceContent: [
			{ generate: { level: 'level5'	} }
		],
		content: [
			{ generate: { level: 'level5'	} },
			{ generate: { level: 'level5'	} },
			{ generate: { level: 'level5'	} },
			{ generate: { level: 'level5'	} },
			{ generate: { level: 'level5'	} }
		]
	}
];
// #endregion

// #region Gameplay functions
export function getShowcaseData(data: TrackTaskDataEntry[]): TrackTaskDataEntry[] {
	const allSymbols = data
		? data.flatMap((entry) =>
				Array.isArray(entry.sequence[0])
					? (entry.sequence as string[][]).flat()
					: (entry.sequence as string[])
			)
		: [];
	const uniqueSymbols = Array.from(new Set(allSymbols));
	return [
		{
			id: 'showcase',
			sequence: uniqueSymbols,
			correct: uniqueSymbols
		}
	];
}
// #endregion

// #region Validation functions
export function fonologieSymbolValidation(
	clickedIndex: number,
	state: TrackTaskState
): TaskMistake[] | true {
	const correctIndices = getFlattenedSymbols(state)
		.map((symbol, index) => (state.dataEntry.correct?.includes(symbol) ? index : -1))
		.filter((index) => index !== -1);

	console.log('Correct indices:', correctIndices);
	console.log('Clicked index:', clickedIndex);

	if (correctIndices.includes(clickedIndex)) {
		return true;
	}

	return [MistakeMisclick];
}

export function fonologieStageValidation(state: TrackTaskState): TaskMistake[] | true {
	const correctIndices = new Set(
		getFlattenedSymbols(state)
			.map((symbol, index) => (state.dataEntry.correct?.includes(symbol) ? index : -1))
			.filter((index) => index !== -1)
	);

	const selectedIndices = new Set(state.selectedCorrectIndices);

	if (
		correctIndices.size === selectedIndices.size &&
		[...correctIndices].every((index) => selectedIndices.has(index))
	) {
		return true;
	}

	return [MistakeUnfinished];
}
// #endregion

// #region Data formatting
export function formatFonologieRawData(rawData: FonologieAudioRawDataEntry): TrackTaskDataEntry {
	const correct = rawData.correct_indices.map((index) => rawData.sequence[index]);
	const correctCount = rawData.sequence.filter((item) => correct?.includes(item)).length;
	return {
		id: rawData.id.toString(),
		sequence: rawData.sequence,
		correct,
		sound: correct?.length === 1 ? correct?.[0].toUpperCase() : correct?.join('').toUpperCase(),
		correctCount
	};
}
// #endregion

export default {
	label,
	description,
	addToList
} satisfies TaskMetadata;
