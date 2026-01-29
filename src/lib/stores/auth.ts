import { writable } from 'svelte/store';
import type { UserRole } from '$lib/types/api.types';

interface AuthUser {
	userId: string;
	username: string;
	firstName: string;
	lastName: string;
	role: UserRole;
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthUser | null>(null);

	return {
		subscribe,
		set,
		clear: () => set(null),
		init: () => {
			// Hydrate from localStorage on app load
			if (typeof window !== 'undefined') {
				const stored = localStorage.getItem('auth_user');
				if (stored) set(JSON.parse(stored));
			}
		}
	};
}

export const authUser = createAuthStore();

// Persist to localStorage when changed
authUser.subscribe((user) => {
	if (typeof window !== 'undefined') {
		if (user) {
			localStorage.setItem('auth_user', JSON.stringify(user));
		} else {
			localStorage.removeItem('auth_user');
		}
	}
});
