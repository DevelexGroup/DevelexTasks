import type { TaskMetadata } from '$lib/types/task.types';

export const addToList = false;
export const label = 'Diagnostika dyslexie';
export const description = 'Example description';

export default {
	label,
	description,
	addToList
} satisfies TaskMetadata;
