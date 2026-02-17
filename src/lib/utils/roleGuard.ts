import { UserRole } from '$lib/types/api.types';
import type { AuthUser } from '$lib/stores/auth';

/**
 * Configuration for role-based access control
 */
export interface RoleGuardConfig {
	allowedRoles: UserRole[];
}

/**
 * Check if a user has permission based on their role
 */
export function hasRolePermission(
	user: AuthUser | null | undefined,
	config: RoleGuardConfig
): boolean {
	if (!user) {
		return false;
	}

	return config.allowedRoles.includes(user.role);
}

/**
 * Predefined role configurations for common access patterns
 */
export const RoleGuards = {
	garantOnly: {
		allowedRoles: [UserRole.Garant]
	} as RoleGuardConfig,

	lectorOnly: {
		allowedRoles: [UserRole.Lector]
	} as RoleGuardConfig,

	studentOnly: {
		allowedRoles: [UserRole.Student]
	} as RoleGuardConfig,

	garantAndLector: {
		allowedRoles: [UserRole.Garant, UserRole.Lector]
	} as RoleGuardConfig,

	lectorAndStudent: {
		allowedRoles: [UserRole.Lector, UserRole.Student]
	} as RoleGuardConfig,

	authenticated: {
		allowedRoles: [UserRole.Garant, UserRole.Lector, UserRole.Student]
	} as RoleGuardConfig
};

/**
 * Get a user-friendly error message for unauthorized access
 */
export function getUnauthorizedMessage(config: RoleGuardConfig): string {
	const roleNames = config.allowedRoles.map((role) => {
		switch (role) {
			case UserRole.Garant:
				return 'Garant';
			case UserRole.Lector:
				return 'Lector';
			case UserRole.Student:
				return 'Student';
			default:
				return role;
		}
	});

	if (roleNames.length === 1) {
		return `This page is only accessible to ${roleNames[0]} users.`;
	}

	const lastRole = roleNames.pop();
	return `This page is only accessible to ${roleNames.join(', ')} and ${lastRole} users.`;
}

export default {
	hasRolePermission,
	RoleGuards,
	getUnauthorizedMessage
};
