import type { TaskMetadata, TrackLevelState } from '$lib/types/task.types';
import { playSound } from '$lib/utils/sound';
import { resolveAny } from '$lib/utils/resolveAny';

export const addToList = true;
export const label = 'Cibule';
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
	if (!state.dataEntry.sequence) return [];
	return Array.isArray(state.dataEntry.sequence[0]) ? (state.dataEntry.sequence as string[][]).flat() : (state.dataEntry.sequence as string[]);
}

export default {
	label,
	description,
	addToList
} satisfies TaskMetadata;
