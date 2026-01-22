import type { Snippet } from 'svelte';
import type { SessionScoreMetrics } from '$lib/database/db.types';

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

export enum TaskResult {
	Natural = 'natural',
	Escape = 'escape',
	Mistake = 'mistake',
	Terminate = 'terminate',
	Timeout = 'timeout'
}

export interface TaskLevelProps {
	id: string;
	onCompleted?: (result: TaskResult) => void;
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
	calculateFluencyScore?: (scoreMetrics: Partial<SessionScoreMetrics>, state: TrackLevelState) => number;
	playValidationSounds?: boolean;
	onStageAdvance?: () => void;
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
	id: string;
	sequence: string[] | string[][];
	correct?: string[];
	wordToRead?: string;
	correctCount?: number;
}

export type TrackLevelDataGenerator = {
	getRandomOfType: string | string[];
};

export type TrackTaskData = TaskLevelData<TrackLevelDataEntry>;
export type TrackTaskPreset = TaskLevelData<TrackLevelDataEntry | TrackLevelDataGenerator>; 
	
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