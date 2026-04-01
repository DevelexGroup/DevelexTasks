import type { PageLoad } from './$types';
import evaluationTaskPresets from '$lib/data/evaluation-task-presets.json';

type RouteMode = 'evaluation' | 'reeducation';

const taskPresetMap = evaluationTaskPresets as Record<string, unknown>;

export const load: PageLoad = ({ params, url }) => {
	const mode: RouteMode = url.searchParams.get('mode') === 'evaluation' ? 'evaluation' : 'reeducation';
	const taskPreset = mode === 'evaluation' ? (taskPresetMap[params.task] ?? null) : null;

	return {
		task: params.task,
		level: params.level,
		mode,
		taskPreset
	};
};
