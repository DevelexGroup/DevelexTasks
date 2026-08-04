import type { TaskMetadata } from '$lib/types/task.types';

export const addToList = true;
export const label = 'Fruit Ninja';
export const description = 'Dwell na jednotlivé ovoce/zeleninu.';

export default {
	label,
	description,
	addToList
} satisfies TaskMetadata;
