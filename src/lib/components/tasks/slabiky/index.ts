import type { TaskMetadata, TaskMistake, TrackLevelState } from '$lib/types/task.types';
import { playSound } from '$lib/utils/sound';
import { resolveAny } from '$lib/utils/resolveAny';

export const addToList = true;
export const label = 'Slabiky';
export const description = 'Example description';

export function tryReadWordFromState(state: TrackLevelState) {
	const wordToRead = state.dataEntry?.wordToRead;
	if (wordToRead) {
		playSound(getWordAudioSource(wordToRead), 0.5);
	}
}

export function getWordAudioSource(word: string): string {
	return resolveAny(`/sound/words/${word}.ogg`);
}

export function getFlattenedSymbols(state: TrackLevelState): string[] {
	if (!state.dataEntry.syllables) return [];
	return Array.isArray(state.dataEntry.syllables[0]) ? (state.dataEntry.syllables as string[][]).flat() : (state.dataEntry.syllables as string[]);
}

export default {
	label,
	description,
	addToList
} satisfies TaskMetadata;
