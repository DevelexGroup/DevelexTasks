import { resolveAny } from '$lib/utils/resolveAny';
import type { CibuleState } from '../../cibule.types';
import type { TaskMistake } from '$lib/types/task.types';
import { MistakeUnfinished } from '$lib/components/tasks/cibule/mistakes.types';

export const id = 'level1';

export const instructionVideo = resolveAny('/video/cibule-instrukce-01.webm');

export function validateStage(state: CibuleState) : TaskMistake[] | true {
	const lastSyllable = state.dataEntry.syllables.findLastIndex((syllable => syllable === state.dataEntry.correctSyllables?.[0]));
	if (!state.selectedCorrectIndices || state.selectedCorrectIndices.length === 0 || state.selectedCorrectIndices[state.selectedCorrectIndices.length - 1] !== lastSyllable) {
		return [MistakeUnfinished];
	}
	return true;
}

export function validateSymbol(clickedIndex: number, state: CibuleState) {
	const correctIndices = state.dataEntry.syllables
		.map((symbol, index) => (symbol === state.dataEntry.correctSyllables?.[0] ? index : -1))
		.filter((index) => index !== -1);

	const testIndices = [...state.selectedCorrectIndices, clickedIndex];

	return testIndices.every((value, i) => value === correctIndices[i]);
}