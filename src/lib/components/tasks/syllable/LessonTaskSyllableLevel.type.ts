import type { SyllableTaskType } from '$lib/types/lesson';
import type { IWordReader } from '$lib/interfaces/IWordReader';

export interface LessonTaskSyllableLevelProps {
	currentContent: SyllableTaskType;
	wordReader: IWordReader;
	shouldReadCorrectSyllable?: boolean;
	isSyllableAssignmentPresent?: boolean;
	correctSyllableVisibilityTimeout?: number;
	/**
	 * Width of the assignment syllable gap in pixels.
	 */
	assignmentGap?: number;
	/**
	 * The gap between the syllables in pixels.
	 */
	syllableGap?: number;
	highlightLine?: boolean;
}
