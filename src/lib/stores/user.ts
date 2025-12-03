import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const USER_STORAGE_KEY = 'user';

export interface User {
	id: string;
}

const DEFAULT_USER: User = {
	id: 'Host'
};

function loadUser(): User {
	if (!browser)
		return DEFAULT_USER;

	try {
		const raw = localStorage.getItem(USER_STORAGE_KEY);

		if (!raw)
			return DEFAULT_USER;

		return JSON.parse(raw) as User;
	} catch {
		return DEFAULT_USER;
	}
}

export const userStore = writable<User>(loadUser());

userStore.subscribe((value) => {
	if (!browser)
		return;

	localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(value));
});
