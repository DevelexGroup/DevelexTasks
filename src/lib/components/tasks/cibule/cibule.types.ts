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
	validateStage?: (state: CibuleState) => boolean;
	onSpace?: (state: CibuleState) => void;
	hintComponent?: Snippet<[HintComponent]>;
	reportMistake?: () => void;
}

export type CibuleState = {
	lastIndex: number | null;
	dataEntry: CibuleLevelDataEntry
}

export enum CibuleLevelStage {
	InitialDwell,
	Task
}

export type CibuleLevelDataEntry = {
	syllables: string[];
	correctSyllables?: string[];
	wordToRead?: string;
}

export type CibuleTaskLevelData = TaskLevelData<CibuleLevelDataEntry>;