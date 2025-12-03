import { resolveAny } from '$lib/utils/resolveAny';
import type { TaskMistake, TrackLevelState } from '$lib/types/task.types';
import { MistakeUnfinished } from '$lib/types/mistakes.types';
import { getFlattenedSymbols } from '$lib/utils/trackLevelUtils';

export const id = 'level1';

export const instructionVideo = resolveAny('/video/cibule-instrukce-01.webm');

export function validateStage(state: TrackLevelState) : TaskMistake[] | true {
	const lastSyllable = getFlattenedSymbols(state).findLastIndex((syllable => syllable === state.dataEntry.correct?.[0]));
	if (!state.selectedCorrectIndices || state.selectedCorrectIndices.length === 0 || state.selectedCorrectIndices[state.selectedCorrectIndices.length - 1] !== lastSyllable) {
		return [MistakeUnfinished];
	}
	return true;
}

export function validateSymbol(clickedIndex: number, state: TrackLevelState) {
	const correctIndices = getFlattenedSymbols(state)
		.map((symbol, index) => (symbol === state.dataEntry.correct?.[0] ? index : -1))
		.filter((index) => index !== -1);

	const testIndices = [...state.selectedCorrectIndices, clickedIndex];

	return testIndices.every((value, i) => value === correctIndices[i]);
}