import { visualDiffLessons } from '$lib/data/lesson/visualDiff';

/** @type {import('./$types').PageLoad} */
export function load() {
	return {
		config: visualDiffLessons.map((i) => ({
			label: i.label,
			level: i.level
		}))
	};
}

export const prerender = true;
