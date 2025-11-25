import type { TaskLevelData, TaskLevelProps } from '$lib/types/task.types';
import type { Snippet } from 'svelte';

export interface HintComponent {
	symbol?: string;
	wordToRead?: string;
	isPractice?: boolean;
}

export interface CibuleTaskProps extends TaskLevelProps {
	data: CibuleLevelDataEntry[];
	repetitions?: number;
	validateSymbol?: (index: number, currentIndex: number | null, correctIndices: number[]) => boolean;
	hintComponent: Snippet<[HintComponent]>;
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