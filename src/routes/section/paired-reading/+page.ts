import { pairedReadingLessonsE } from '$lib/data/lesson/pairedReading.js';

/** @type {import('./$types').PageLoad} */
export function load() {
	const levelArray = pairedReadingLessonsE.map((i) => i.level);

	return {
		config: levelArray
	};
}

export const prerender = true;
