import { TaskStage } from '$lib/types/task.types';
import { writable } from 'svelte/store';

export const taskStage = writable<TaskStage>(TaskStage.Loading);
