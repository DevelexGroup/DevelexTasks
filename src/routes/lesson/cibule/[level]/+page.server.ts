import { cibuleLessons } from '$lib/data/lesson/cibule';

/** @type {import('./$types').EntryGenerator} */
export function entries() {
	return cibuleLessons.map((lesson) => ({
		level: lesson.level
	}));
}

export const prerender = true;
