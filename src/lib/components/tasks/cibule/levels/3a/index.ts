import { resolveAny } from '$lib/utils/resolveAny';
import type { TaskMistake, TrackTaskState } from '$lib/types/task.types';
import { MistakeMisclick, MistakeSkipped, MistakeUnfinished } from '$lib/types/mistakes.types';
import { getFlattenedSymbols } from '$lib/utils/trackLevelUtils';
import type { CibuleRawDataEntry } from '$lib/components/tasks/cibule/cibule.types';
import { cibuleL3aRawData } from '$lib/components/tasks/cibule/cibule.data';

export const id = 'level3a';
export const rawData: CibuleRawDataEntry[] = cibuleL3aRawData;
export const instructionVideo = resolveAny('/video/cibule-instrukce-03a.webm');

export function validateStage(state: TrackTaskState): TaskMistake[] | true {
	const lastSyllable = getFlattenedSymbols(state).findLastIndex(
		(syllable) => syllable === state.dataEntry.correct?.[state.dataEntry.correct.length - 1]
	);
	if (
		!state.selectedCorrectIndices ||
		state.selectedCorrectIndices.length === 0 ||
		state.selectedCorrectIndices[state.selectedCorrectIndices.length - 1] !== lastSyllable
	) {
		return [MistakeUnfinished];
	}
	return true;
}

export function validateSymbol(clickedIndex: number, state: TrackTaskState): TaskMistake[] | true {
	const correctSyllables = state.dataEntry.correct ?? [];
	const flattenedSymbols = getFlattenedSymbols(state);

	// Build correct indices while skipping already used indices
	const correctIndices: number[] = [];
	const usedIndices = new Set<number>();
	for (const syllable of correctSyllables) {
		const index = flattenedSymbols.findIndex((s, i) => s === syllable && !usedIndices.has(i));
		if (index !== -1) {
			correctIndices.push(index);
			usedIndices.add(index);
		}
	}

	const testIndices = [...state.selectedCorrectIndices, clickedIndex];

	if (testIndices.every((value, i) => value === correctIndices[i])) {
		return true;
	}

	// Skipped check
	if (correctIndices.includes(clickedIndex)) {
		return [MistakeSkipped];
	}

	// Otherwise we misclicked
	return [MistakeMisclick];
}
