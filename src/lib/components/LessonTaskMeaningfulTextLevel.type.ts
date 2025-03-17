import type { MeaningfulTextTaskType } from '$lib/types/lesson';
import type { IWordReader } from '$lib/interfaces/IWordReader';

export interface LessonTaskMeaningfulTextLevelProps {
	currentContent: MeaningfulTextTaskType;
	wordReader: IWordReader;
	width: number;
}
