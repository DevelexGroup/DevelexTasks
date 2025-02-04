import { fonologicLesson } from '$lib/data/lesson/fonologic';

/** @type {import('./$types').EntryGenerator} */
export function entries() {
	return fonologicLesson.map((lesson) => ({
		level: lesson.level
	}));
}

export const prerender = true;
