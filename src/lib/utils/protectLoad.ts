import { redirect } from '@sveltejs/kit';
import { authUser } from '$lib/stores/auth';
import { hasRolePermission, type RoleGuardConfig } from './roleGuard';
import { get } from 'svelte/store';
import type { AuthUser } from '$lib/stores/auth';

export interface ProtectLoadOptions {
	config: RoleGuardConfig;
	redirectTo?: string;
	getAuthUser?: () => AuthUser | null | undefined;
}

export function protectLoad(options: ProtectLoadOptions) {
	const { config, redirectTo = '/login', getAuthUser } = options;

	return async () => {
		const user = getAuthUser ? getAuthUser() : get(authUser);

		if (!hasRolePermission(user, config)) {
			throw redirect(303, redirectTo);
		}

		return { user };
	};
}

export function createProtectedLoad<T>(
	options: ProtectLoadOptions,
	loadFn: (params: { user: AuthUser | null | undefined }) => Promise<T> | T
) {
	const { config, redirectTo = '/login', getAuthUser } = options;

	return async () => {
		const user = getAuthUser ? getAuthUser() : get(authUser);

		if (!hasRolePermission(user, config)) {
			throw redirect(303, redirectTo);
		}

		const result = await loadFn({ user });

		return { user, ...result };
	};
}
