import { syllableLessons } from '$lib/data/lesson/syllable.js';

/** @type {import('./$types').EntryGenerator} */
export function entries() {
	return syllableLessons.map((lesson) => ({
		level: lesson.level
	}));
}

export const prerender = true;
