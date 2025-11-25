import { resolveAny } from '$lib/utils/resolveAny';
import type { CibuleValidateSymbolFunction } from '$lib/components/tasks/cibule/cibule.types';

export const id = 'level3a';

export const instructionVideo = resolveAny('/video/cibule-instrukce-03a.webm');

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

export function getAudioSource(word: string): string {
	return resolveAny(`/sound/words/${word}.ogg`);
}