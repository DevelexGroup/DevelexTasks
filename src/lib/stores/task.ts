import { TaskState } from '$lib/types/task.types';
import { writable } from 'svelte/store';

export const taskState = writable<TaskState>(TaskState.Loading);
