import { visualDiffLessons } from '$lib/data/lesson/visualDiff';

/** @type {import('./$types').EntryGenerator} */
export function entries() {
	return visualDiffLessons.map((lesson) => ({
		level: lesson.level
	}));
}

export const prerender = true;
