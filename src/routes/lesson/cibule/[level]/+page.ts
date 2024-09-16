import { cibuleLessons } from '$lib/data/lesson/cibule';

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	const selectedLevel = cibuleLessons.find((level) => level.level === params.level);

	return {
		config: selectedLevel
	};
}
