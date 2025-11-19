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
	onCompleted: () => void;
}

export type TaskLevelData<TaskContent> = {
	levelID: string;
	label: string;
	practice_content: TaskContent[];
	content: TaskContent[];
}[];