import type { Snippet } from 'svelte';
import type { SessionScoreMetrics } from '$lib/database/db.types';
import type { PartialArrayable } from '$lib/types/util.types';

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

export type TaskData<TContent> = {
	levelID: string;
	label: string;
	practiceContent: TContent[];
	content: TContent[];
}[];

export type TaskMistake = {
	id: string;
	details?: string;
	audio?: string;
};

export interface BaseTaskProps {
	id: string;
	onCompleted?: (result: TaskResult) => void;
	isPractice?: boolean;
}

// Track task types
export interface TrackTaskProps extends BaseTaskProps {
	data: TrackTaskDataEntry[];
	validateSymbol?: (clickedIndex: number, state: TrackTaskState) => TaskMistake[] | true;
	validateStage?: (state: TrackTaskState) => TaskMistake[] | true;
	calculateFluencyScore?: (
		scoreMetrics: Partial<SessionScoreMetrics>,
		state: TrackTaskState
	) => number;
	playValidationSounds?: boolean;
	onStageAdvance?: () => void;
	onSpace?: (state: TrackTaskState) => void;
	trackComponent?: Snippet<[TrackComponent]>;
	hintComponent?: Snippet<[ExtraComponent]>;
	extraComponent?: Snippet<[ExtraComponent]>;
}

export type TrackTaskState = {
	selectedCorrectIndices: number[];
	dataEntry: TrackTaskDataEntry;
};

export enum TrackSlideStage {
	InitialDwell,
	Task
}

export interface TrackTaskDataEntry {
	id: string;
	sequence: string[] | string[][];
	correct?: string[];
	wordToRead?: string;
	correctCount?: number;
}

export type TrackTaskData = TaskData<TrackTaskDataEntry>;

export interface TrackTaskPresetEntryDefinition extends TrackTaskDataEntry {
	generate?: null;
}
export interface TrackTaskPresetEntryGenerator<TDataEntry> {
	generate: PartialArrayable<TDataEntry> & { type?: string | string[] };
}

export type TrackTaskPreset<TDataEntry> = TaskData<
	TrackTaskPresetEntryDefinition | TrackTaskPresetEntryGenerator<TDataEntry>
>;

// Components

export interface ExtraComponent {
	state: TrackTaskState;
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
