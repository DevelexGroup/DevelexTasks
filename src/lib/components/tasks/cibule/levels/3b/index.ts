import { resolveAny } from '$lib/utils/resolveAny';
import type { TaskMistake, TrackTaskState } from '$lib/types/task.types';
import { MistakeMisclick, MistakeSkipped, MistakeUnfinished } from '$lib/types/mistakes.types';
import { getFlattenedSymbols } from '$lib/utils/trackLevelUtils';
import type { CibuleRawDataEntry } from '$lib/components/tasks/cibule/cibule.types';
import { cibuleL3RawData } from '$lib/components/tasks/cibule/cibule.data';

export const id = 'level3b';
export const rawData: CibuleRawDataEntry[] = cibuleL3RawData;
export const instructionVideo = resolveAny('/video/cibule-instrukce-03b.webm');

export function validateStage(state: TrackTaskState): TaskMistake[] | true {
	const correctSyllables = state.dataEntry.correct ?? [];
	const flattenedSymbols = getFlattenedSymbols(state);

	// Compare syllables at selected indices with correct syllables
	const selectedSyllables = state.selectedCorrectIndices.map((i) => flattenedSymbols[i]);

	console.log(correctSyllables, selectedSyllables);

	if (
		correctSyllables.length !== selectedSyllables.length ||
		selectedSyllables.some((value, i) => value !== correctSyllables[i])
	) {
		return [MistakeUnfinished];
	}
	return true;
}

export function validateSymbol(clickedIndex: number, state: TrackTaskState): TaskMistake[] | true {
	const correctSyllables = state.dataEntry.correct ?? [];
	const flattenedSymbols = getFlattenedSymbols(state);
	const clickedSyllable = flattenedSymbols[clickedIndex];

	// Get the expected syllable at the current position
	const currentPosition = state.selectedCorrectIndices.length;
	const expectedSyllable = correctSyllables[currentPosition];

	// Check if clicked syllable matches the expected syllable
	if (clickedSyllable === expectedSyllable) {
		return true;
	}

	// Skipped check - clicked a correct syllable but not in order
	if (correctSyllables.includes(clickedSyllable)) {
		return [MistakeSkipped];
	}

	// Otherwise we misclicked
	return [MistakeMisclick];
}

export const isSyllableFrameVisible = (
	state: TrackTaskState,
	syllable: string,
	positionIndex: number
): boolean => {
	if (positionIndex >= state.selectedCorrectIndices.length) {
		return false;
	}

	const flattenedSymbols = getFlattenedSymbols(state);
	const selectedIndex = state.selectedCorrectIndices[positionIndex];
	return flattenedSymbols[selectedIndex] === syllable;
};
