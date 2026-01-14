import { TaskStage } from '$lib/types/task.types';
import { writable } from 'svelte/store';

export const currentTask = writable<{
	slug: string;
	level: string;
	session: string;
	stimulusId: string;
	currentRepetition: number;
} | null>(null);
export const taskStage = writable<TaskStage>(TaskStage.Loading);
