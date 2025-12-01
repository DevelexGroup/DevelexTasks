import { resolveAny } from '$lib/utils/resolveAny';
import { playSound, SOUND_MISTAKE } from '$lib/utils/sound';
import { getFlattenedSymbols, tryReadWordFromState } from '$lib/components/tasks/cibule';
import type { TaskMistake, TrackLevelState } from '$lib/types/task.types';
import { MistakeUnfinished } from '$lib/types/mistakes.types';

export const id = 'level3b';

export const instructionVideo = resolveAny('/video/cibule-instrukce-03b.webm');

export function validateStage(state: TrackLevelState) : TaskMistake[] | true {
	const correctSyllables = state.dataEntry.correctSyllables ?? [];
	const correctIndices = correctSyllables.map(syllable => getFlattenedSymbols(state).indexOf(syllable)).filter(i => i !== -1);

	console.log(correctIndices, state.selectedCorrectIndices);

	if (correctIndices.length !== state.selectedCorrectIndices.length || state.selectedCorrectIndices.some((value, i) => value !== correctIndices[i])){
		return [MistakeUnfinished];
	}
	return true;
}

export function validateSymbol(clickedIndex: number, state: TrackLevelState) {
	const correctSyllables = state.dataEntry.correctSyllables ?? [];
	const correctIndices = correctSyllables.map(syllable => getFlattenedSymbols(state).indexOf(syllable)).filter(i => i !== -1);

	const testIndices = [...state.selectedCorrectIndices, clickedIndex];

	return testIndices.every((value, i) => value === correctIndices[i]);
}

export const onSpace = (state: TrackLevelState) => {
	if (validateStage(state) === true)
		tryReadWordFromState(state);
	else {
		playSound(SOUND_MISTAKE, 0.33);
	}
}

export const getIndexOfSyllable = (state: TrackLevelState, syllable: string): number | null => {
	if (!state.dataEntry.syllables) return null;
	const index = getFlattenedSymbols(state).indexOf(syllable);
	return index !== -1 ? index : null;
};

export const isSyllableFrameVisible = (state: TrackLevelState, syllable: string): boolean => {
	const index = getIndexOfSyllable(state, syllable);
	if (index === null)
		return false;
	return state.selectedCorrectIndices.includes(index);
};