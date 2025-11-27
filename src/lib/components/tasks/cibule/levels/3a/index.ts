import { resolveAny } from '$lib/utils/resolveAny';
import type {
	CibuleState,
	CibuleValidateSymbolFunction
} from '$lib/components/tasks/cibule/cibule.types';
import type { TaskMistake } from '$lib/types/task.types';
import { MistakeUnfinished } from '$lib/components/tasks/cibule/mistakes.types';

export const id = 'level3a';

export const instructionVideo = resolveAny('/video/cibule-instrukce-03a.webm');

export function validateStage(state: CibuleState) : TaskMistake[] | true {
	const lastSyllable = state.dataEntry.syllables.findLastIndex((syllable => syllable === state.dataEntry.correctSyllables?.[state.dataEntry.correctSyllables.length - 1]));
	if (state.lastIndex === null || state.lastIndex < lastSyllable) {
		return [MistakeUnfinished];
	}
	return true;
}

export const validateSymbol: CibuleValidateSymbolFunction = (index, lastIndex, dataEntry) => {
	const correctSyllables = dataEntry.correctSyllables ?? [];
	const correctIndices: number[] = [];

	if (correctSyllables.length > 0) {
		let charIndex = 0;
		for (let i = 0; i < dataEntry.syllables.length; i++) {
			const symbol = dataEntry.syllables[i];
			if (symbol === correctSyllables[charIndex]) {
				correctIndices.push(i);
				charIndex = (charIndex + 1) % correctSyllables.length;
			}
		}
	}

	if (lastIndex === null) {
		return correctIndices.includes(index) && index === correctIndices[0];
	}
	const indexOfLastIndex = correctIndices.indexOf(lastIndex);
	if (indexOfLastIndex === -1) {
		return false;
	}
	return correctIndices.includes(index) && indexOfLastIndex !== correctIndices.length - 1 && index === correctIndices[indexOfLastIndex + 1];
}

export function tryReadWordFromState(state: CibuleState) {
	const wordToRead = state.dataEntry?.wordToRead;
	if (wordToRead) {
		const audioSrc = getWordAudioSource(wordToRead);
		const audio = new Audio(audioSrc);
		audio.volume = 0.5;
		audio.play();
	}
}

export function getWordAudioSource(word: string): string {
	return resolveAny(`/sound/words/${word}.ogg`);
}