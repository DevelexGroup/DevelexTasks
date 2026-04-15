import type { PageLoad } from './$types';
import { getTaskModeConfig, getTaskModePreset, parseTaskMode, resolveExcludeTags } from '$lib/utils/taskMode';

export const load: PageLoad = ({ params, url }) => {
	const mode = parseTaskMode(url);
	const modeConfig = getTaskModeConfig(mode);
	const modePreset = getTaskModePreset(mode, params.task);

	return {
		task: params.task,
		level: params.level,
		mode,
		modeQuery: modeConfig.query,
		taskPreset: modePreset?.levels ?? null,
		excludeTags: resolveExcludeTags(modePreset),
		useCategories: modePreset?.useCategories ?? true
	};
};
