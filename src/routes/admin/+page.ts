import { protectLoad } from '$lib/utils/protectLoad';
import { RoleGuards } from '$lib/utils/roleGuard';
export const load = protectLoad({
	config: RoleGuards.garantOnly,
	redirectTo: '/login'
});

