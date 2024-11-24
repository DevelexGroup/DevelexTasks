import { pairedReadingLessonsE } from '$lib/data/lesson/pairedReading';

/** @type {import('./$types').EntryGenerator} */
export function entries() {
	return pairedReadingLessonsE.map((lesson) => ({
		level: lesson.level
	}));
}

export const prerender = true;
