import {
	exportableTasks,
	type ExportStimulus,
	type ExportableLevel
} from '$lib/utils/stimulusExport/registry';
import { registryLevelId, type ParsedTaskName } from './taskName';

export interface ResolvedSlide {
	level: ExportableLevel;
	stimulus: ExportStimulus;
}

/**
 * Resolves the exact stimulus shown on a slide by its recorded stimulus_id.
 * Selection/randomization logic is never re-run, so registry-backed tasks
 * resolve deterministically. Returns null for tasks outside the registry
 * (dwell-symbols, paired-reading) or unknown stimulus ids.
 */
export function resolveSlide(parsed: ParsedTaskName, stimulusId: string): ResolvedSlide | null {
	const task = exportableTasks.find((candidate) => candidate.slug === parsed.slug);
	if (!task) return null;

	const levelId = registryLevelId(parsed);
	const level = task.levels.find((candidate) => candidate.levelId === levelId);
	if (!level) return null;

	const stimulus = level.stimuli.find((candidate) => candidate.id === stimulusId);
	if (!stimulus) return null;

	return { level, stimulus };
}
