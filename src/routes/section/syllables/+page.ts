import { syllableLessons } from '$lib/data/lesson/syllable';

/** @type {import('./$types').PageLoad} */
export function load() {
	const levelArray = syllableLessons.map((i) => i.level);

	return {
		config: levelArray
	};
}

export const prerender = true;
