import { cibuleLessons } from '$lib/data/lesson/cibule';

/** @type {import('./$types').PageLoad} */
export function load() {
	return {
		config: cibuleLessons.map((i) => ({
			label: i.label,
			level: i.level
		}))
	};
}

export const prerender = true;
