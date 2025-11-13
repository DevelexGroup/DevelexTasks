import type { TaskMetadata } from '$lib/types/task.types';

export const addToList = true;
export const label = 'Cibule';
export const description = 'Example description';

export default {
	label,
	description,
	addToList
} satisfies TaskMetadata;
