import { meaningfulTextLessons } from '$lib/data/lesson/meaningfulText';

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	const selectedLevel = meaningfulTextLessons.find((level) => level.level === params.level);

	return {
		config: selectedLevel
	};
}
