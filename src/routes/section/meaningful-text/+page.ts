import { meaningfulTextLessons } from '$lib/data/lesson/meaningfulText';

/** @type {import('./$types').PageLoad} */
export function load() {
	return {
		config: meaningfulTextLessons.map((i) => ({
			label: i.label,
			level: i.level
		}))
	};
}

export const prerender = true;
