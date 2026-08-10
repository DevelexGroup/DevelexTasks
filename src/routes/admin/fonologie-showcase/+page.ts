import { protectLoad } from '$lib/utils/protectLoad';
import { Guards } from '$lib/utils/capabilityGuard';

export const load = protectLoad({
	caps: Guards.adminArea,
	redirectTo: '/login'
});
