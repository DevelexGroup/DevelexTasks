import type { TaskMetadata } from '$lib/types/task.types';
import type { PageLoad } from './$types';
import { getTaskModeConfig, getTaskModePreset, parseTaskMode, resolveExcludeTags } from '$lib/utils/taskMode';

export const load: PageLoad = ({ params, url }) => {
	const mode = parseTaskMode(url);
	const modeConfig = getTaskModeConfig(mode);
	const modePreset = getTaskModePreset(mode, params.task);

	// Resolve level label from presets (same logic as tasks/[task]/+page.ts)
	const modeLevelLabel = modePreset?.levels.find((p) => p.levelID === params.level)?.label;

	const taskModules = import.meta.glob<TaskMetadata>('/src/lib/components/tasks/*/index.ts', {
		eager: true
	});
	const taskPath = Object.keys(taskModules).find((path) =>
		path.includes(`/tasks/${params.task}/index.ts`)
	);
	const defaultPreset = taskPath ? (taskModules[taskPath].defaultPreset ?? []) : [];
	const defaultLevelLabel = defaultPreset.find((p) => p.levelID === params.level)?.label;

	const levelLabel = modeLevelLabel ?? defaultLevelLabel ?? null;

	return {
		task: params.task,
		level: params.level,
		levelLabel,
		mode,
		modeQuery: modeConfig.query,
		taskPreset: modePreset?.levels ?? null,
		excludeTags: resolveExcludeTags(modePreset),
		useCategories: modePreset?.useCategories ?? true
	};
};
