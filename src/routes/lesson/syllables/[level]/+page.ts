import { syllableLessons } from '$lib/data/lesson/syllable.js';

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	const selectedLevel = syllableLessons.find((level) => level.level === params.level);

	return {
		config: selectedLevel
	};
}
