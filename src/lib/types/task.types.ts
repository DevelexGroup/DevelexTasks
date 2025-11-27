export interface TaskMetadata {
	label: string;
	description: string;
	addToList: boolean;
}

export enum TaskState {
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