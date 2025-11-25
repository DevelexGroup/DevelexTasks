import { resolveAny } from '$lib/utils/resolveAny';
import type { CibuleValidateSymbolFunction } from '../../cibule.types';

export const id = 'level1';

export const instructionVideo = resolveAny('/video/cibule-instrukce-01.webm');

export const validateSymbol: CibuleValidateSymbolFunction = (index, lastIndex, dataEntry) => {
	const correctIndices = dataEntry.syllables
		.map((symbol, index) => (symbol === dataEntry.correctSyllables?.[0] ? index : -1))
		.filter((index) => index !== -1)
	if (lastIndex === null) {
		return correctIndices.includes(index) && index === correctIndices[0];
	}
	const indexOfLastIndex = correctIndices.indexOf(lastIndex);
	if (indexOfLastIndex === -1) {
		return false;
	}
	return correctIndices.includes(index) && indexOfLastIndex !== correctIndices.length - 1 && index === correctIndices[indexOfLastIndex + 1];
}