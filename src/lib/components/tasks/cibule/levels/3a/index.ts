import { resolveAny } from '$lib/utils/resolveAny';
import { playSound, SOUND_MISTAKE } from '$lib/utils/sound';
import { getFlattenedSymbols, tryReadWordFromState } from '$lib/components/tasks/cibule';
import type { TaskMistake, TrackLevelState } from '$lib/types/task.types';
import { MistakeUnfinished } from '$lib/components/tasks/cibule/mistakes.types';

export const id = 'level3a';

export const instructionVideo = resolveAny('/video/cibule-instrukce-03a.webm');

export function validateStage(state: TrackLevelState) : TaskMistake[] | true {
	const lastSyllable = getFlattenedSymbols(state).findLastIndex((syllable => syllable === state.dataEntry.correctSyllables?.[state.dataEntry.correctSyllables.length - 1]));
	if (!state.selectedCorrectIndices || state.selectedCorrectIndices.length === 0 || state.selectedCorrectIndices[state.selectedCorrectIndices.length - 1] !== lastSyllable) {
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