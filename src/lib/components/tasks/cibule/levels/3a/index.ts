import { resolveAny } from '$lib/utils/resolveAny';
import type { CibuleState } from '$lib/components/tasks/cibule/cibule.types';
import { playSound, SOUND_MISTAKE } from '$lib/utils/sound';
import { tryReadWordFromState } from '$lib/components/tasks/cibule';
import type { TaskMistake } from '$lib/types/task.types';
import { MistakeUnfinished } from '$lib/components/tasks/cibule/mistakes.types';

export const id = 'level3a';

export const instructionVideo = resolveAny('/video/cibule-instrukce-03a.webm');

export function validateStage(state: CibuleState) : TaskMistake[] | true {
	const lastSyllable = state.dataEntry.syllables.findLastIndex((syllable => syllable === state.dataEntry.correctSyllables?.[state.dataEntry.correctSyllables.length - 1]));
	if (!state.selectedCorrectIndices || state.selectedCorrectIndices.length === 0 || state.selectedCorrectIndices[state.selectedCorrectIndices.length - 1] !== lastSyllable) {
		return [MistakeUnfinished];
	}
	return true;
}

export function validateSymbol(clickedIndex: number, state: CibuleState) {
	const correctSyllables = state.dataEntry.correctSyllables ?? [];
	const correctIndices = correctSyllables.map(syllable => state.dataEntry.syllables.indexOf(syllable)).filter(i => i !== -1);

	const testIndices = [...state.selectedCorrectIndices, clickedIndex];

	return testIndices.every((value, i) => value === correctIndices[i]);
}

export const onSpace = (state: CibuleState) => {
	if (validateStage(state) === true)
		tryReadWordFromState(state);
	else {
		playSound(SOUND_MISTAKE, 0.33);
	}
}