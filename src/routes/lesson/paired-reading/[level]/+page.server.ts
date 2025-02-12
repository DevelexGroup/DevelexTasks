import { pairedReadingLessons } from '$lib/data/lesson/pairedReading';

/** @type {import('./$types').EntryGenerator} */
export function entries() {
	return pairedReadingLessons.map((lesson) => ({
		level: lesson.level
	}));
}

export const prerender = true;
