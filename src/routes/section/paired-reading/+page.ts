import { pairedReadingLessons } from '$lib/data/lesson/pairedReading.js';

/** @type {import('./$types').PageLoad} */
export function load() {
	const levelArray = pairedReadingLessons;

	return {
		config: levelArray
	};
}

export const prerender = true;
