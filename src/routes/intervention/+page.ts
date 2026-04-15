import type { TaskMetadata } from '$lib/types/task.types';
import type { PageLoad } from './$types';
import { buildModeTaskList } from '$lib/utils/taskMode';

export const load: PageLoad = async () => {
	const modules = import.meta.glob<TaskMetadata>('/src/lib/components/tasks/*/index.ts', {
		eager: true
	});

	return { tasks: buildModeTaskList(modules, 'intervention') };
};
