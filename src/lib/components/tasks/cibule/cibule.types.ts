import type { TaskLevelData, TaskLevelProps } from '$lib/types/task.types';

export interface CibuleTaskProps extends TaskLevelProps {
	data: CibuleLevelDataEntry[];
	repetitions?: number;
	validateSymbol?: (index: number, currentIndex: number | null, correctIndices: number[]) => boolean;
}

export enum CibuleLevelState {
	InitialDwell,
	Task
}

export type CibuleLevelDataEntry = {
	syllables: string[];
	correctSyllable?: string;
	incorrectSyllable?: string;
	wordToRead?: string;
	binding?: Record<number, number>;
}

export type CibuleTaskLevelData = TaskLevelData<CibuleLevelDataEntry>;