import { fonologicLesson } from '$lib/data/lesson/fonologic.js';

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	const selectedLevel = fonologicLesson.find((level) => level.level === params.level);

	return {
		config: selectedLevel
	};
}
