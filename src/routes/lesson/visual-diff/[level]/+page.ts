import { visualDiffLessons } from '$lib/data/lesson/visualDiff.js';

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	const selectedLevel = visualDiffLessons.find((level) => level.level === params.level);

	return {
		config: selectedLevel
	};
}
