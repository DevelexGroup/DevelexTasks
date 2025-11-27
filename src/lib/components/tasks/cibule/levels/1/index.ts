import { resolveAny } from '$lib/utils/resolveAny';
import type { CibuleState, CibuleValidateSymbolFunction } from '../../cibule.types';
import type { TaskMistake } from '$lib/types/task.types';
import { MistakeUnfinished } from '$lib/components/tasks/cibule/mistakes.types';

export const id = 'level1';

export const instructionVideo = resolveAny('/video/cibule-instrukce-01.webm');

export function validateStage(state: CibuleState) : TaskMistake[] | true {
	const lastSyllable = state.dataEntry.syllables.findLastIndex((syllable => syllable === state.dataEntry.correctSyllables?.[0]));
	if (state.lastIndex === null || state.lastIndex < lastSyllable) {
		return [MistakeUnfinished];
	}
	return true;
}

export const validateSymbol: CibuleValidateSymbolFunction = (index, lastIndex, dataEntry) => {
	const correctIndices = dataEntry.syllables
		.map((symbol, index) => (symbol === dataEntry.correctSyllables?.[0] ? index : -1))
		.filter((index) => index !== -1)
	if (lastIndex === null) {
		return correctIndices.includes(index) && index === correctIndices[0];
	}
	const indexOfLastIndex = correctIndices.indexOf(lastIndex);
	if (indexOfLastIndex === -1) {
		return false;
	}
	return correctIndices.includes(index) && indexOfLastIndex !== correctIndices.length - 1 && index === correctIndices[indexOfLastIndex + 1];
}