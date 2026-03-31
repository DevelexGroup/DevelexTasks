import type { TaskMetadata } from '$lib/types/task.types';
import type { PageLoad } from './$types';

type LevelMetadata = {
	label?: string;
};

type RouteMode = 'evaluation' | 'reeducation';

export const load: PageLoad = async ({ params, url }) => {
	const { task: taskSlug } = params;
	const mode: RouteMode = url.searchParams.get('mode') === 'evaluation' ? 'evaluation' : 'reeducation';

	const taskModules = import.meta.glob<TaskMetadata>('/src/lib/components/tasks/*/index.ts', {
		eager: true
	});

	const taskPath = Object.keys(taskModules).find((path) =>
		path.includes(`/tasks/${taskSlug}/index.ts`)
	);

	if (!taskPath) {
		throw new Error(`Task '${taskSlug}' not found`);
	}

	const task = taskModules[taskPath];
	const levelModules = import.meta.glob(`/src/lib/components/tasks/*/levels/*/Task.svelte`, {
		eager: true
	});
	const levelMetadataModules = import.meta.glob<LevelMetadata>(
		`/src/lib/components/tasks/*/levels/*/index.ts`,
		{
			eager: true
		}
	);

	const levels = Object.keys(levelModules)
		.filter((path) => path.includes(`/tasks/${taskSlug}/levels/`))
		.map((path) => {
			const slug = path.split('/').at(-2);
			if (!slug) {
				return null;
			}

			const levelMetadataPath = path.replace('/Task.svelte', '/index.ts');
			const levelMetadata = levelMetadataModules[levelMetadataPath];

			return {
				slug,
				label: levelMetadata?.label ?? `Level: ${slug}`
			};
		})
		.filter((level): level is { slug: string; label: string } => level !== null)
		.sort((a, b) => a.slug.localeCompare(b.slug, undefined, { numeric: true }));

	return {
		levels,
		mode,
		task: {
			slug: taskSlug,
			...task
		}
	};
};
