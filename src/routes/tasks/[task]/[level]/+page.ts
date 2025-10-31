import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	return {
		task: params.task,
		level: params.level
	};
};
