import { TaskResult, TaskStage, type TrackTaskState } from '$lib/types/task.types';
import type { TaskMode } from '$lib/utils/taskMode';
import { writable } from 'svelte/store';

export const currentTask = writable<{
	slug: string;
	level: string;
	mode: TaskMode;
	sessionId: string;
	stimulusId: string;
	currentSlideIndex: number;
	result: TaskResult | null;
} | null>(null);

export const taskStage = writable<TaskStage>(TaskStage.Loading);

export const remoteTestSessionId = writable<string | null>(null);
export const remoteTestSessionActivePartId = writable<string | null>(null);
export const testSessionUploading = writable<boolean>(false);
export const clientLogUploading = writable<boolean>(false);
