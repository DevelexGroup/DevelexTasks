import type { TaskMistake, TrackTaskState } from '$lib/types/task.types';
import { playSoundOrTTS } from '$lib/utils/sound';
import { resolveAny } from '$lib/utils/resolveAny';
import { AnalyticsManager } from '$lib/utils/analyticsManager';
import {
	MistakeMisclick,
	MistakeSkipped,
	MistakeUnfinished,
	MistakeWrongOrder
} from '$lib/types/mistakes.types';

export function tryReadWordFromState(state: TrackTaskState, analyticsManager?: AnalyticsManager) {
	const wordToRead = state.dataEntry?.wordToRead;
	if (wordToRead) {
		const audioSource = getWordAudioSource(wordToRead);
		analyticsManager?.setSoundActive(audioSource, true);
		playSoundOrTTS(audioSource, wordToRead.toLowerCase(), 'cs-CZ', 0.5).finally(() => {
			analyticsManager?.setSoundActive(audioSource, false);
		});
	}
}

export function getWordAudioSource(word: string): string {
	return resolveAny(`/sound/syllables/${word.toLowerCase()}.ogg`);
}

export function getFlattenedSymbols(state: TrackTaskState): string[] {
	if (!state.dataEntry.sequence) return [];
	return Array.isArray(state.dataEntry.sequence[0]) ? (state.dataEntry.sequence as string[][]).flat() : (state.dataEntry.sequence as string[]);
}

export function defaultValidateStage(state: TrackTaskState) : TaskMistake[] | true {
	const lastSyllable = getFlattenedSymbols(state).findLastIndex((syllable => syllable === state.dataEntry.correct?.[0]));
	if (!state.selectedCorrectIndices || state.selectedCorrectIndices.length === 0 || state.selectedCorrectIndices[state.selectedCorrectIndices.length - 1] !== lastSyllable) {
		return [MistakeUnfinished];
	}
	return true;
}

export function defaultValidateSymbol(clickedIndex: number, state: TrackTaskState): TaskMistake[] | true {
	// Wrong order check
	if (state.selectedCorrectIndices.length > 0) {
		const lastSelectedIndex = state.selectedCorrectIndices[state.selectedCorrectIndices.length - 1];
		if (clickedIndex <= lastSelectedIndex) {
			return [MistakeWrongOrder]
		}
	}

	// Correctness check
	const correctIndices = getFlattenedSymbols(state)
		.map((symbol, index) => (symbol === state.dataEntry.correct?.[0] ? index : -1))
		.filter((index) => index !== -1);

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