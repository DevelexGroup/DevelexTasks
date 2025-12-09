import type { Snippet } from 'svelte';

export interface TaskMetadata {
	label: string;
	description: string;
	addToList: boolean;
}

export enum TaskStage {
	Loading,
	Instructions,
	Practice,
	Task,
	End,
	Error
}

export interface TaskLevelProps {
	id: string;
	onCompleted?: () => void;
	isPractice?: boolean;
}

export type TaskLevelData<TaskContent> = {
	levelID: string;
	label: string;
	practiceContent: TaskContent[];
	content: TaskContent[];
}[];

export type TaskMistake = {
	id: string;
	details?: string;
	audio?: string;
};

// Track task types

export interface TrackTaskProps extends TaskLevelProps {
	data: TrackLevelDataEntry[];
	validateSymbol?: (clickedIndex: number, state: TrackLevelState) => TaskMistake[] | true;
	validateStage?: (state: TrackLevelState) => TaskMistake[] | true;
	onSpace?: (state: TrackLevelState) => void;
	trackComponent?: Snippet<[TrackComponent]>;
	hintComponent?: Snippet<[ExtraComponent]>;
	extraComponent?: Snippet<[ExtraComponent]>;
}

export type TrackLevelState = {
	selectedCorrectIndices: number[],
	dataEntry: TrackLevelDataEntry
}

export enum TrackLevelStage {
	InitialDwell,
	Task
}

export type TrackLevelDataEntry = {
	sequence: string[] | string[][];
	correct?: string[];
	wordToRead?: string;
}

export type TrackTaskData = TaskLevelData<TrackLevelDataEntry>;

export interface ExtraComponent {
	state: TrackLevelState;
	isPractice?: boolean;
}

export interface TrackComponent {
	symbols: string[] | string[][];
	validateSymbolClick: (symbol: string, index: number) => boolean;
	correctSymbols?: string[];
	letterSpacing?: number;
	symbolSpacing?: number;
}

export interface TrackSymbolComponent {
	symbol?: string;
	index?: number;
	validateSymbolClick?: (symbol: string, index: number) => boolean;
	interactable?: boolean;
	letterSpacing?: number;
}