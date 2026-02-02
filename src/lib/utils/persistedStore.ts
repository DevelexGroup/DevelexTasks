import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

type StorageType = 'local' | 'session';

function getStorage(type: StorageType): Storage | null {
	if (!browser) return null;
	return type === 'local' ? localStorage : sessionStorage;
}

function loadFromStorage<T>(key: string, defaultValue: T, type: StorageType): T {
	const storage = getStorage(type);
	if (!storage) return defaultValue;

	try {
		const stored = storage.getItem(key);
		if (stored === null) return defaultValue;
		return JSON.parse(stored) as T;
	} catch {
		return defaultValue;
	}
}

function saveToStorage<T>(key: string, value: T, type: StorageType): void {
	getStorage(type)?.setItem(key, JSON.stringify(value));
}

function removeFromStorage(key: string, type: StorageType): void {
	getStorage(type)?.removeItem(key);
}

function createPersistedStore<T>(key: string, defaultValue: T, type: StorageType): Writable<T> {
	const initialValue = loadFromStorage(key, defaultValue, type);
	const store = writable<T>(initialValue);

	if (browser) {
		store.subscribe((value) => {
			saveToStorage(key, value, type);
		});
	}

	return store;
}

function createPersistedNullableStore<T>(key: string, type: StorageType): Writable<T | null> {
	const initialValue = loadFromStorage<T | null>(key, null, type);
	const store = writable<T | null>(initialValue);

	if (browser) {
		store.subscribe((value) => {
			if (value === null || value === undefined) {
				removeFromStorage(key, type);
			} else {
				saveToStorage(key, value, type);
			}
		});
	}

	return store;
}

// ============================================================================
// localStorage - persists across browser sessions
// ============================================================================

/**
 * Creates a Svelte writable store that automatically persists to localStorage.
 * Data survives page reloads and browser restarts.
 *
 * @param key - The localStorage key to use for persistence
 * @param defaultValue - The default value if nothing is stored
 */
export function persisted<T>(key: string, defaultValue: T): Writable<T> {
	return createPersistedStore(key, defaultValue, 'local');
}

/**
 * Creates a Svelte writable store that persists to localStorage,
 * but removes the entry when set to null/undefined.
 *
 * @param key - The localStorage key to use for persistence
 */
export function persistedNullable<T>(key: string): Writable<T | null> {
	return createPersistedNullableStore<T>(key, 'local');
}

// ============================================================================
// sessionStorage - persists only for the current tab/session
// ============================================================================

/**
 * Creates a Svelte writable store that automatically persists to sessionStorage.
 * Data survives page reloads but is cleared when the tab is closed.
 * Useful for temporary state like form progress, wizard steps, or UI state.
 *
 * @param key - The sessionStorage key to use for persistence
 * @param defaultValue - The default value if nothing is stored
 */
export function session<T>(key: string, defaultValue: T): Writable<T> {
	return createPersistedStore(key, defaultValue, 'session');
}

/**
 * Creates a Svelte writable store that persists to sessionStorage,
 * but removes the entry when set to null/undefined.
 *
 * @param key - The sessionStorage key to use for persistence
 */
export function sessionNullable<T>(key: string): Writable<T | null> {
	return createPersistedNullableStore<T>(key, 'session');
}
