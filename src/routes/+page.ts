import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const modules = import.meta.glob('/src/lib/components/tasks/*/index.ts', { eager: true });

	const tasks = Object.entries(modules)
		.map(([path, mod]) => {
			const task = mod as {
				label: string;
				addToList: boolean;
			};

			const slug = path.split('/').at(-2);

			return { slug, ...task };
		})
		.filter((task) => task.addToList);

	return { tasks };
};
