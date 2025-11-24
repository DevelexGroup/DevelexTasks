import { resolveAny } from '$lib/utils/resolveAny';

export const instructionVideo = resolveAny('/video/cibule-instrukce-02.webm');

export function validateSymbol(index: number, currentIndex: number | null, correctIndices: number[]): boolean {
	if (currentIndex === null) {
		return correctIndices.includes(index) && index === correctIndices[0];
	}
	const indexOfCurrentIndex = correctIndices.indexOf(currentIndex);
	if (indexOfCurrentIndex === -1) {
		return false;
	}
	console.log(correctIndices.includes(index), indexOfCurrentIndex !== correctIndices.length - 1, index === correctIndices[indexOfCurrentIndex + 1])
	return correctIndices.includes(index) && indexOfCurrentIndex !== correctIndices.length - 1 && index === correctIndices[indexOfCurrentIndex + 1];
}