import { resolveAny } from '$lib/utils/resolveAny';
import type { CibuleState } from '$lib/components/tasks/cibule/cibule.types';
import { playSound, SOUND_MISTAKE } from '$lib/utils/sound';
import { tryReadWordFromState } from '$lib/components/tasks/cibule';
import type { TaskMistake } from '$lib/types/task.types';
import { MistakeUnfinished } from '$lib/components/tasks/cibule/mistakes.types';

export const id = 'level3b';

export const instructionVideo = resolveAny('/video/cibule-instrukce-03b.webm');

export function validateStage(state: CibuleState) : TaskMistake[] | true {
	const correctSyllables = state.dataEntry.correctSyllables ?? [];
	const correctIndices = correctSyllables.map(syllable => state.dataEntry.syllables.indexOf(syllable)).filter(i => i !== -1);

	console.log(correctIndices, state.selectedCorrectIndices);

	if (correctIndices.length !== state.selectedCorrectIndices.length || state.selectedCorrectIndices.some((value, i) => value !== correctIndices[i])){
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