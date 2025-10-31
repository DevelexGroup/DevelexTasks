import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const { task: taskSlug } = params;

	const taskModules = import.meta.glob<{ label: string; addToList: boolean }>(
		'/src/lib/components/tasks/*/index.ts',
		{ eager: true }
	);

	const taskPath = Object.keys(taskModules).find((path) =>
		path.includes(`/tasks/${taskSlug}/index.ts`)
	);

	if (!taskPath) {
		throw new Error(`Task '${taskSlug}' not found`);
	}

	const task = taskModules[taskPath];
	const levelModules = import.meta.glob(`/src/lib/components/tasks/*/levels/*/Core.svelte`, {
		eager: true
	});

	const levels = Object.keys(levelModules)
		.filter((path) => path.includes(`/tasks/${taskSlug}/levels/`))
		.map((path) => path.split('/').at(-2))
		.sort((a, b) => Number(a) - Number(b));

	return {
		levels,
		task: {
			slug: taskSlug,
			...task
		}
	};
};
