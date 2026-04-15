import type { TaskMetadata, TrackTaskPresetUnknown } from '$lib/types/task.types';
import type { PageLoad } from './$types';
import { getTaskModeConfig, getTaskModePreset, parseTaskMode } from '$lib/utils/taskMode';

export const load: PageLoad = async ({ params, url }) => {
	const { task: taskSlug } = params;
	const mode = parseTaskMode(url);
	const modeConfig = getTaskModeConfig(mode);
	const modePreset = getTaskModePreset(mode, taskSlug);

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
	const defaultPreset: TrackTaskPresetUnknown = task.defaultPreset ?? [];

	const modeLabelByLevel = new Map(
		(modePreset?.levels ?? []).map((preset) => [preset.levelID, preset.label])
	);
	const defaultLabelByLevel = new Map(
		defaultPreset.map((preset) => [preset.levelID, preset.label])
	);

	const levelModules = import.meta.glob(`/src/lib/components/tasks/*/levels/*/Task.svelte`, {
		eager: true
	});

	const levelIndexModules = import.meta.glob<{ label?: string }>(
		'/src/lib/components/tasks/*/levels/*/index.ts',
		{ eager: true }
	);

	const levelIndexLabelBySlug = new Map(
		Object.entries(levelIndexModules)
			.filter(([path]) => path.includes(`/tasks/${taskSlug}/levels/`))
			.map(([path, mod]) => [path.split('/').at(-2)!, mod.label])
			.filter((entry): entry is [string, string] => entry[1] != null)
	);

	const levels = Object.keys(levelModules)
		.filter((path) => path.includes(`/tasks/${taskSlug}/levels/`))
		.map((path) => {
			const slug = path.split('/').at(-2);
			if (!slug) {
				return null;
			}

			return {
				slug,
				label:
					modeLabelByLevel.get(slug) ?? defaultLabelByLevel.get(slug) ?? levelIndexLabelBySlug.get(slug) ?? `Level: ${slug}`
			};
		})
		.filter((level): level is { slug: string; label: string } => level !== null)
		.filter((level) => {
			return (
				modePreset == null ||
				modePreset.levels.some((preset) => preset.levelID === level.slug)
			);
		})
		.sort((a, b) => a.slug.localeCompare(b.slug, undefined, { numeric: true }));

	return {
		levels,
		mode,
		modeQuery: modeConfig.query,
		modeListPath: modeConfig.listPath,
		modePageHeading: modeConfig.pageHeading,
		modeLevelCardClass: modeConfig.levelCardClass,
		modeStartButtonClass: modeConfig.startButtonClass,
		task: {
			slug: taskSlug,
			label: modePreset?.label ?? task.label,
			description: task.description,
			addToList: task.addToList
		}
	};
};
