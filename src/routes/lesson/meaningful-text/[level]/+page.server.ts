import { meaningfulTextLessons } from '$lib/data/lesson/meaningfulText';

/** @type {import('./$types').EntryGenerator} */
export function entries() {
	return meaningfulTextLessons.map((lesson) => ({
		level: lesson.level
	}));
}

export const prerender = true;
