export interface TaskMetadata {
	label: string;
	description: string;
	addToList: boolean;
}

export enum TaskState {
	Loading,
	Instructions,
	Task,
	Error
}
