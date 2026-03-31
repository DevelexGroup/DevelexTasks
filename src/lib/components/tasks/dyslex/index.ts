import type { TaskMetadata } from '$lib/types/task.types';

export const addToList = false;
export const label = 'Diagnostika dyslexie';
export const description = 'Example description';
export const diagnosticMode = true;

export default {
	label,
	description,
	addToList,
	diagnosticMode
} satisfies TaskMetadata;
