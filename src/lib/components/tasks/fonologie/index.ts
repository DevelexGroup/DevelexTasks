import type { TaskMetadata, TaskMistake, TrackTaskState } from '$lib/types/task.types';
import { MistakeMisclick, MistakeUnfinished } from '$lib/types/mistakes.types';
import { getFlattenedSymbols } from '$lib/utils/trackLevelUtils';

export const addToList = true;
export const label = 'Fonologie';
export const description = 'Example description';

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

export default {
	label,
	description,
	addToList
} satisfies TaskMetadata;
