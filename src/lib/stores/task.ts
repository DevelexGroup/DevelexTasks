import { TaskResult, TaskStage, type TrackTaskState } from '$lib/types/task.types';
import { writable } from 'svelte/store';

export const currentTask = writable<{
	slug: string;
	level: string;
	session: string;
	stimulusId: string;
	currentRepetition: number;
	result: TaskResult | null;
} | null>(null);

export const taskStage = writable<TaskStage>(TaskStage.Loading);

export const remoteTestSessionId = writable<string | null>(null);
export const remoteTestSessionActivePartId = writable<string | null>(null);
