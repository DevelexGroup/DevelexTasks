import type { Capability, GroupDTO, UserRole } from '$lib/types/api.types';
import { persistedNullable } from '../utils/persistedStore';
import { browser } from '$app/environment';
import { get } from 'svelte/store';

export interface AuthUser {
	userId: string;
	username: string;
	firstName: string | null;
	lastName: string | null;
	role: UserRole;
	capabilities: Capability[];
	groups: GroupDTO[];
}

export interface AuthSession {
	user: AuthUser;
	expiresAt: number; // Unix timestamp in milliseconds
}

export const authSession = persistedNullable<AuthSession>('auth_session_v2');

if (browser) {
	localStorage.removeItem('auth_session');
	const session = get(authSession);
	if (session && !Array.isArray(session.user?.capabilities)) {
		authSession.set(null);
	}
}

// Derived accessor for backward compatibility
export const authUser = {
	subscribe: (run: (_value: AuthUser | null) => void) => {
		return authSession.subscribe((session) => {
			run(session?.user ?? null);
		});
	},
	set: (_user: AuthUser | null) => {
		// This is a no-op for setting just the user
		// Use setAuthSession instead
		console.warn('Use setAuthSession() instead of authUser.set()');
	}
};

/**
 * Check if the current auth session token has expired
 */
export function isTokenExpired(): boolean {
	const session = get(authSession);
	if (!session) return true;

	// Add a small buffer (30 seconds) to account for clock skew
	const bufferMs = 30 * 1000;
	return Date.now() >= session.expiresAt - bufferMs;
}

/**
 * Get time until token expires in milliseconds
 * Returns 0 if already expired or no session
 */
export function getTimeUntilExpiry(): number {
	const session = get(authSession);
	if (!session) return 0;

	const remaining = session.expiresAt - Date.now();
	return Math.max(0, remaining);
}

/**
 * Set auth session with user and expiry
 */
export function setAuthSession(user: AuthUser, expiresAt: Date): void {
	authSession.set({
		user,
		expiresAt: expiresAt.getTime()
	});
}

/**
 * Clear auth session (logout)
 */
export function clearAuthSession(): void {
	authSession.set(null);
}
