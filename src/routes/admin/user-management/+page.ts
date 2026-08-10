import { protectLoad } from '$lib/utils/protectLoad';

export const load = protectLoad({
	caps: ['USER_READ_ALL', 'GROUP_READ_OWN', 'GROUP_READ_ALL'],
	redirectTo: '/login'
});
