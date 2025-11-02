import type { Readable } from 'svelte/store';

export const waitForStoreCondition = async <T>(
	store: Readable<T>,
	predicate: (value: T) => boolean,
	timeout?: number
) => {
	return new Promise((resolve, reject) => {
		const unsubscribe = store.subscribe((value) => {
			if (predicate(value)) {
				if (timeout) {
					clearTimeout(timer);
				}

				unsubscribe();
				resolve(value);
			}
		});

		let timer: NodeJS.Timeout;

		if (timeout) {
			timer = setTimeout(() => {
				unsubscribe();
				reject(new Error('Timeout while waiting for condition'));
			}, timeout);
		}
	});
};

export const waitForTimeout = async (timeout: number) =>
	new Promise((resolve) => setTimeout(resolve, timeout));
