import { redirect } from '@sveltejs/kit';
import { authUser } from '$lib/stores/auth';
import { hasCapability } from './capabilityGuard';
import { get } from 'svelte/store';
import type { AuthUser } from '$lib/stores/auth';
import type { Capability } from '$lib/types/api.types';

export interface ProtectLoadOptions {
	caps: Capability[];
	redirectTo?: string;
	getAuthUser?: () => AuthUser | null | undefined;
}

export function protectLoad(options: ProtectLoadOptions) {
	const { caps, redirectTo = '/login', getAuthUser } = options;

	return async () => {
		const user = getAuthUser ? getAuthUser() : get(authUser);

		if (!hasCapability(user, ...caps)) {
			throw redirect(303, redirectTo);
		}

		return { user };
	};
}

export function createProtectedLoad<T>(
	options: ProtectLoadOptions,
	loadFn: (params: { user: AuthUser | null | undefined }) => Promise<T> | T
) {
	const { caps, redirectTo = '/login', getAuthUser } = options;

	return async () => {
		const user = getAuthUser ? getAuthUser() : get(authUser);

		if (!hasCapability(user, ...caps)) {
			throw redirect(303, redirectTo);
		}

		const result = await loadFn({ user });

		return { user, ...result };
	};
}
