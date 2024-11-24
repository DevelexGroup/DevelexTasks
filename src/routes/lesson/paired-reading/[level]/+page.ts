import { pairedReadingLessonsE } from '$lib/data/lesson/pairedReading.js';

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	const selectedLevel = pairedReadingLessonsE.find((level) => level.level === params.level);

	return {
		config: selectedLevel
	};
}
