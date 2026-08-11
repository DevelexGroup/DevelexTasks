import { DEFAULT_TASK_MODE, TASK_MODES, type TaskMode } from '$lib/utils/taskMode';

export interface ParsedTaskName {
	slug: string;
	level: string;
	mode: TaskMode;
}

// Longest-first so slugs containing dashes match before their prefixes
const KNOWN_SLUGS = [
	'dwell-symbols',
	'paired-reading',
	'fonologie',
	'zrakovka',
	'slabiky',
	'cibule',
	'dyslex'
].sort((a, b) => b.length - a.length);

/** Inverse of formatTaskName: `${slug}-${level}` with an optional `-${mode}` suffix. */
export function parseTaskName(taskName: string): ParsedTaskName | null {
	const slug = KNOWN_SLUGS.find((known) => taskName.startsWith(known + '-'));
	if (!slug) return null;

	let level = taskName.slice(slug.length + 1);
	let mode: TaskMode = DEFAULT_TASK_MODE;
	for (const candidate of TASK_MODES) {
		if (candidate !== DEFAULT_TASK_MODE && level.endsWith('-' + candidate)) {
			mode = candidate;
			level = level.slice(0, -(candidate.length + 1));
			break;
		}
	}

	if (!level) return null;
	return { slug, level, mode };
}

/** Dyslex routes use directory names while the stimulus registry uses bare level ids. */
export const DYSLEX_LEVEL_MAP: Record<string, string> = {
	'1_syllables': 'syllables',
	'2_meantext': 'meantext',
	'3_pseudotext': 'pseudotext',
	'4_visdiff': 'visdiff'
};

export function registryLevelId(parsed: ParsedTaskName): string {
	if (parsed.slug === 'dyslex') return DYSLEX_LEVEL_MAP[parsed.level] ?? parsed.level;
	return parsed.level;
}
