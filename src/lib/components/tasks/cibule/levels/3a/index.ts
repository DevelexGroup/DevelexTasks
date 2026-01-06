import { resolveAny } from '$lib/utils/resolveAny';
import { playSound, SOUND_MISTAKE } from '$lib/utils/sound';
import type { TaskMistake, TrackLevelState } from '$lib/types/task.types';
import { MistakeMisclick, MistakeSkipped, MistakeUnfinished } from '$lib/types/mistakes.types';
import { getFlattenedSymbols, tryReadWordFromState } from '$lib/utils/trackLevelUtils';
import type { CibuleRawDataEntry } from '$lib/components/tasks/cibule/cibule.types';
import { cibuleL3aRawData } from '$lib/components/tasks/cibule/cibule.data';

export const id = 'level3a';
export const rawData: CibuleRawDataEntry[] = cibuleL3aRawData;
export const instructionVideo = resolveAny('/video/cibule-instrukce-03a.webm');

export function validateStage(state: TrackLevelState) : TaskMistake[] | true {
	const lastSyllable = getFlattenedSymbols(state).findLastIndex((syllable => syllable === state.dataEntry.correct?.[state.dataEntry.correct.length - 1]));
	if (!state.selectedCorrectIndices || state.selectedCorrectIndices.length === 0 || state.selectedCorrectIndices[state.selectedCorrectIndices.length - 1] !== lastSyllable) {
		return [MistakeUnfinished];
	}
	return true;
}

export function validateSymbol(clickedIndex: number, state: TrackLevelState): TaskMistake[] | true {
	const correctSyllables = state.dataEntry.correct ?? [];
	const correctIndices = correctSyllables.map(syllable => getFlattenedSymbols(state).indexOf(syllable)).filter(i => i !== -1);

	const testIndices = [...state.selectedCorrectIndices, clickedIndex];

	if (testIndices.every((value, i) => value === correctIndices[i])) {
		return true;
	}

	// Skipped check
	if (correctIndices.includes(clickedIndex)){
		return [MistakeSkipped];
	}

	// Otherwise we misclicked
	return [MistakeMisclick];
}

export const onSpace = (state: TrackLevelState) => {
	if (validateStage(state) === true)
		tryReadWordFromState(state);
	else {
		playSound(SOUND_MISTAKE, 0.33);
	}
}