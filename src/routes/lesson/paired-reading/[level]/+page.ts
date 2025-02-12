import { pairedReadingLessons } from '$lib/data/lesson/pairedReading.js';

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	const selectedLevel = pairedReadingLessons.find((level) => level.level === params.level);

	return {
		config: selectedLevel
	};
}
