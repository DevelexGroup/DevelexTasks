import type { Capability } from '$lib/types/api.types';
import type { AuthUser } from '$lib/stores/auth';

/**
 * Check if a user holds ANY of the given capabilities
 */
export function hasCapability(
	user: AuthUser | null | undefined,
	...caps: Capability[]
): boolean {
	if (!user?.capabilities) {
		return false;
	}
	return caps.some((cap) => user.capabilities.includes(cap));
}

/**
 * Predefined capability sets for common access patterns
 */
export const Guards = {
	runTests: ['SESSION_RUN_OWN'],
	viewResults: ['SESSION_READ_GROUP', 'SESSION_READ_ALL'],
	viewAllResults: ['SESSION_READ_ALL'],
	manageSessions: ['SESSION_MANAGE_ALL'],
	readAllUsers: ['USER_READ_ALL'],
	manageUsers: ['USER_MANAGE_ALL'],
	viewGroups: ['GROUP_READ_OWN', 'GROUP_READ_ALL'],
	createGroups: ['GROUP_CREATE', 'GROUP_MANAGE_ALL'],
	manageGroups: ['GROUP_MANAGE_OWN', 'GROUP_MANAGE_ALL'],
	editOwnedGroups: ['GROUP_EDIT_OWNED', 'GROUP_MANAGE_ALL'],
	adminArea: ['SESSION_READ_GROUP', 'SESSION_READ_ALL', 'USER_MANAGE_ALL']
} satisfies Record<string, Capability[]>;

export default {
	hasCapability,
	Guards
};
