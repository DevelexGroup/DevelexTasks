import type { TrackLevelState } from '$lib/types/task.types';
import { playSound } from '$lib/utils/sound';
import { resolveAny } from '$lib/utils/resolveAny';
import { getContext } from 'svelte';
import { AnalyticsManager } from '$lib/utils/analyticsManager';
import { ANALYTICS_MANAGER_KEY } from '$lib/types/general.types';

export function tryReadWordFromState(state: TrackLevelState) {
	const wordToRead = state.dataEntry?.wordToRead;
	if (wordToRead) {
		const analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);
		const audioSource = getWordAudioSource(wordToRead);
		analyticsManager.setSoundActive(audioSource, true);
		playSound(audioSource, 0.5).finally(() => {
			analyticsManager.setSoundActive(audioSource, false);
		});
	}
}

export function getWordAudioSource(word: string): string {
	return resolveAny(`/sound/words/${word}.ogg`);
}

export function getFlattenedSymbols(state: TrackLevelState): string[] {
	if (!state.dataEntry.sequence) return [];
	return Array.isArray(state.dataEntry.sequence[0]) ? (state.dataEntry.sequence as string[][]).flat() : (state.dataEntry.sequence as string[]);
}