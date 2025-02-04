import { fonologicLesson } from '$lib/data/lesson/fonologic';

/** @type {import('./$types').PageLoad} */
export function load() {
	return {
		config: fonologicLesson.map((i) => ({
			label: i.label,
			level: i.level
		}))
	};
}

export const prerender = true;
