import type { TaskMetadata, TrackTaskPresetUnknown } from '$lib/types/task.types';
import evaluationPresets from '$lib/data/evaluation-task-presets.json';
import interventionPresets from '$lib/data/intervention-task-presets.json';

export const MODE_TAGS = ['evaluation'] as const;

export const TASK_MODES = ['reeducation', 'evaluation', 'intervention'] as const;
export type TaskMode = (typeof TASK_MODES)[number];

export const DEFAULT_TASK_MODE: TaskMode = 'reeducation';

export type TaskModeListPath = `/${TaskMode}`;

export interface TaskModePreset {
	label?: string;
	includeTags?: string[];
	excludeTags?: string[];
	useCategories?: boolean;
	levels: TrackTaskPresetUnknown;
}

export type TaskModePresetMap = Record<string, TaskModePreset>;

export interface TaskModeConfig {
	slug: TaskMode;
	query: string;
	listPath: TaskModeListPath;
	presets: TaskModePresetMap | null;
	pageHeading: string;
	levelCardClass: string;
	startButtonClass: string;
}

const TASK_MODE_CONFIG: Record<TaskMode, TaskModeConfig> = {
	reeducation: {
		slug: 'reeducation',
		query: '',
		listPath: '/reeducation',
		presets: null,
		pageHeading: 'Úloha',
		levelCardClass: 'bg-indigo-50 hover:border-blue-600/20',
		startButtonClass: 'bg-blue-600 hover:bg-blue-700'
	},
	evaluation: {
		slug: 'evaluation',
		query: '?mode=evaluation',
		listPath: '/evaluation',
		presets: evaluationPresets as unknown as TaskModePresetMap,
		pageHeading: 'Evaluace',
		levelCardClass: 'bg-amber-50 hover:border-amber-600/20',
		startButtonClass: 'bg-amber-600 hover:bg-orange-700'
	},
	intervention: {
		slug: 'intervention',
		query: '?mode=intervention',
		listPath: '/intervention',
		presets: interventionPresets as unknown as TaskModePresetMap,
		pageHeading: 'Intervence',
		levelCardClass: 'bg-cyan-50 hover:border-cyan-600/20',
		startButtonClass: 'bg-cyan-600 hover:bg-cyan-700'
	}
};

export function isTaskMode(value: string | null | undefined): value is TaskMode {
	return value != null && (TASK_MODES as readonly string[]).includes(value);
}

export function parseTaskMode(url: URL): TaskMode {
	const raw = url.searchParams.get('mode');
	return isTaskMode(raw) ? raw : DEFAULT_TASK_MODE;
}

export function getTaskModeConfig(mode: TaskMode): TaskModeConfig {
	return TASK_MODE_CONFIG[mode];
}

export function getTaskModePreset(mode: TaskMode, taskSlug: string): TaskModePreset | null {
	return getTaskModeConfig(mode).presets?.[taskSlug] ?? null;
}

export function formatTaskName(slug: string, level: string, mode: TaskMode): string {
	return mode === DEFAULT_TASK_MODE ? `${slug}-${level}` : `${slug}-${level}-${mode}`;
}

export function resolveExcludeTags(preset: TaskModePreset | null): string[] {
	const include = new Set(preset?.includeTags ?? []);
	const base = MODE_TAGS.filter((tag) => !include.has(tag));
	return [...base, ...(preset?.excludeTags ?? [])];
}

/**
 * Builds the task list for a mode's main menu from a glob of task index modules.
 * - With a preset: only tasks that have a preset entry are included.
 * - Without a preset: all tasks with `addToList: true` are included.
 * Task label is the preset's override if provided, otherwise the task's default label.
 */
export function buildModeTaskList(
	modules: Record<string, TaskMetadata>,
	mode: TaskMode
): { slug: string; label: string }[] {
	const presets = getTaskModeConfig(mode).presets;

	return Object.entries(modules)
		.map(([path, mod]) => {
			const slug = path.split('/').at(-2);
			return { slug, mod, preset: slug ? (presets?.[slug] ?? null) : null };
		})
		.filter(
			(entry): entry is { slug: string; mod: TaskMetadata; preset: TaskModePreset | null } => {
				if (entry.slug == null) return false;
				return presets ? entry.preset != null : entry.mod.addToList;
			}
		)
		.map(({ slug, mod, preset }) => ({
			slug,
			label: preset?.label ?? mod.label
		}));
}
