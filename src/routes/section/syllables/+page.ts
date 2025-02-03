import { syllableLessons } from '$lib/data/lesson/syllable';

/** @type {import('./$types').PageLoad} */
export function load() {
	return {
		config: syllableLessons.map((i) => ({
			label: i.label,
			level: i.level
		}))
	};
}

export const prerender = true;
