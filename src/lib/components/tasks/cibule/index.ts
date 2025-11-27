import type { TaskMetadata } from '$lib/types/task.types';
import { playSound } from '$lib/utils/sound';
import { resolveAny } from '$lib/utils/resolveAny';
import type { CibuleState } from '$lib/components/tasks/cibule/cibule.types';
export const addToList = true;
export const label = 'Cibule';
export const description = 'Example description';

export function tryReadWordFromState(state: CibuleState) {
	const wordToRead = state.dataEntry?.wordToRead;
	if (wordToRead) {
		playSound(getWordAudioSource(wordToRead), 0.5);
	}
}

export function getWordAudioSource(word: string): string {
	return resolveAny(`/sound/words/${word}.ogg`);
}

export default {
	label,
	description,
	addToList
} satisfies TaskMetadata;
