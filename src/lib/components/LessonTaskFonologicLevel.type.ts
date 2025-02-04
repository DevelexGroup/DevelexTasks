import type { FonologicTaskType } from '$lib/types/lesson';
import type { IWordReader } from '$lib/interfaces/IWordReader';

export interface LessonTaskFonologicLevelProps {
	currentContent: FonologicTaskType;
	wordReader: IWordReader;
	shouldReadCorrectSyllable?: boolean;
	isSyllableAssignmentPresent?: boolean;
	correctSyllableVisibilityTimeout?: number;
	markWantedSyllables?: boolean;
	/**
	 * Width of the assignment syllable gap in pixels.
	 */
	assignmentGap?: number;
	/**
	 * The gap between the syllables in pixels.
	 */
	syllableGap?: number;
}
