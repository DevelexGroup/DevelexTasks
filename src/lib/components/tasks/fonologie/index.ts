import type {
	TaskMetadata,
	TaskMistake,
	TrackTaskDataEntry,
	TrackTaskPreset,
	TrackTaskState
} from '$lib/types/task.types';
import { MistakeMisclick, MistakeUnfinished } from '$lib/types/mistakes.types';
import { getFlattenedSymbols } from '$lib/utils/trackLevelUtils';
import type { FonologieTaskRawDataEntry } from '$lib/components/tasks/fonologie/fonologie.types';

export const addToList = true;
export const label = 'Zvuková skládačka';
export const description = 'Example description';

// #region Presets
export const fonologieLevelPreset: TrackTaskPreset<FonologieTaskRawDataEntry> = [
	{
		levelID: '1',
		label: 'Úroveň 1',
		practiceContent: [
			{
				task_id: 'fonologie',
				id: 'FOB123',
				topic: 'předměty',
				set: 'objects',
				level: 'level1',
				sound: 'Ž_zac',
				sequence: ['zebrik', 'zezlo', 'zahon', 'retez', 'zinka'],
				correct_indices: [0, 1, 4]
			}
		],
		content: [
			{ generate: { level: 'level1' } },
			{ generate: { level: 'level1' } },
			{ generate: { level: 'level1' } },
			{ generate: { level: 'level1' } },
			{ generate: { level: 'level1' } }
		]
	},
	{
		levelID: '2',
		label: 'Úroveň 2',
		practiceContent: [
			{
				task_id: 'fonologie',
				id: 'FF1210',
				topic: 'jídlo',
				set: 'food1',
				level: 'level2',
				sound: 'K_kon',
				sequence: ['dort', 'syr', 'paprika', 'rohlik', 'cesnek'],
				correct_indices: [3, 4]
			}
		],
		content: [
			{ generate: { level: 'level2' } },
			{ generate: { level: 'level2' } },
			{ generate: { level: 'level2' } },
			{ generate: { level: 'level2' } },
			{ generate: { level: 'level2' } }
		]
	},
	{
		levelID: '3',
		label: 'Úroveň 3',
		practiceContent: [
			{
				task_id: 'fonologie',
				id: 'FNA306',
				topic: 'příroda',
				set: 'nature',
				level: 'level3',
				sound: 'R_upr',
				sequence: ['strom', 'bahno', 'hory', 'hnizdo', 'ostrov'],
				correct_indices: [0, 2, 4]
			}
		],
		content: [
			{ generate: { level: 'level3' } },
			{ generate: { level: 'level3' } },
			{ generate: { level: 'level3' } },
			{ generate: { level: 'level3' } },
			{ generate: { level: 'level3' } }
		]
	},
	{
		levelID: '4',
		label: 'Úroveň 4',
		practiceContent: [
			{
				task_id: 'fonologie',
				id: 'FL4004',
				level: 'level4',
				sound: '4004',
				model: ['mesto'],
				sequence: ['testo', 'triko', 'tenis', 'vesta'],
				correct_indices: [0]
			}
		],
		content: [
			{ generate: { level: 'level4' } },
			{ generate: { level: 'level4' } },
			{ generate: { level: 'level4' } },
			{ generate: { level: 'level4' } },
			{ generate: { level: 'level4' } }
		]
	},
	{
		levelID: '5',
		label: 'Úroveň 5',
		practiceContent: [
			{
				task_id: 'fonologie',
				id: 'FL5004',
				level: 'level5',
				sound: '5004',
				model: ['knizka'],
				sequence: ['vazka3', 'tucnak5', 'tuzka', 'hruska2'],
				correct_indices: [2]
			}
		],
		content: [
			{ generate: { level: 'level5' } },
			{ generate: { level: 'level5' } },
			{ generate: { level: 'level5' } },
			{ generate: { level: 'level5' } },
			{ generate: { level: 'level5' } }
		]
	}
];
// #endregion

// #region Gameplay functions
export function getShowcaseData(data: TrackTaskDataEntry[], shuffle = false): TrackTaskDataEntry[] {
	const allSymbols = data
		? data.flatMap((entry) =>
				Array.isArray(entry.sequence[0])
					? (entry.sequence as string[][]).flat()
					: (entry.sequence as string[])
			)
		: [];
	const uniqueSymbols = Array.from(new Set(allSymbols));
	if (shuffle) {
		for (let i = uniqueSymbols.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[uniqueSymbols[i], uniqueSymbols[j]] = [uniqueSymbols[j], uniqueSymbols[i]];
		}
	}
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

	// console.log('Correct indices:', correctIndices);
	// console.log('Clicked index:', clickedIndex);

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
export function formatFonologieRawData(rawData: FonologieTaskRawDataEntry): TrackTaskDataEntry {
	const sequencePath = rawData.sequence;
	const correct = rawData.correct_indices.map((index) => sequencePath[index]);
	const correctCount = sequencePath.filter((item) => correct?.includes(item)).length;
	const dataEntry: TrackTaskDataEntry = {
		id: rawData.id.toString(),
		sequence: sequencePath,
		correct,
		sound: `${rawData.sound}.ogg`,
		correctCount,
		topic: 'topic' in rawData ? rawData.topic : undefined
	};

	// Add model if it's a manipulation task
	if ('model' in rawData) {
		return {
			...dataEntry,
			model: rawData.model
		};
	}

	return dataEntry;
}
// #endregion

export const defaultPreset = fonologieLevelPreset;

export default {
	label,
	description,
	addToList,
	defaultPreset
} satisfies TaskMetadata;
