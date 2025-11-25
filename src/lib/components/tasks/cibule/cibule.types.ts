import type { TaskLevelData, TaskLevelProps } from '$lib/types/task.types';
import type { Snippet } from 'svelte';

export interface HintComponent {
	symbol?: string;
	wordToRead?: string;
	isPractice?: boolean;
}

// export type CibuleValidateSymbolFunction = (index: number, currentIndex: number | null, correctIndices: number[]) => boolean;
export type CibuleValidateSymbolFunction = (index: number, lastIndex: number | null, dataEntry: CibuleLevelDataEntry) => boolean;

export interface CibuleTaskProps extends TaskLevelProps {
	data: CibuleLevelDataEntry[];
	repetitions?: number;
	validateSymbol?: CibuleValidateSymbolFunction;
	hintComponent?: Snippet<[HintComponent]>;
}

export enum CibuleLevelState {
	InitialDwell,
	Task
}

export type CibuleLevelDataEntry = {
	syllables: string[];
	correctSyllables?: string[];
	wordToRead?: string;
}

export type CibuleTaskLevelData = TaskLevelData<CibuleLevelDataEntry>;