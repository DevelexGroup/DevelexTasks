import { cibuleLessons } from '$lib/data/lesson/cibule';

/** @type {import('./$types').PageLoad} */
export function load() {
	const levelArray = cibuleLessons.map((i) => i.level);

	return {
		config: levelArray
	};
}

export const prerender = true;
