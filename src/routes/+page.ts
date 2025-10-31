import type { TaskMetadata } from '$lib/types/task.types';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const modules = import.meta.glob<TaskMetadata>('/src/lib/components/tasks/*/index.ts', {
		eager: true
	});

	const tasks = Object.entries(modules)
		.map(([path, mod]) => {
			const slug = path.split('/').at(-2);

			return { slug, ...mod };
		})
		.filter((task) => task.addToList);

	return { tasks };
};
