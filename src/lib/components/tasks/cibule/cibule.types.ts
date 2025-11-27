import type { TaskLevelData, TaskLevelProps, TaskMistake } from '$lib/types/task.types';
import type { Snippet } from 'svelte';

export interface ExtraComponent {
	state: CibuleState;
	isPractice?: boolean;
}

export interface CibuleTaskProps extends TaskLevelProps {
	data: CibuleLevelDataEntry[];
	repetitions?: number;
	validateSymbol?: (clickedIndex: number, state: CibuleState) => boolean;
	validateStage?: (state: CibuleState) => TaskMistake[] | true;
	onSpace?: (state: CibuleState) => void;
	reportMistake?: (mistakes: TaskMistake[]) => void;
	hintComponent?: Snippet<[ExtraComponent]>;
	extraComponent?: Snippet<[ExtraComponent]>;
}

export type CibuleState = {
	selectedCorrectIndices: number[],
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