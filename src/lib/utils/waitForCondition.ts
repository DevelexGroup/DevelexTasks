import type { Readable } from 'svelte/store';

export const waitForCondition = (store: Readable<boolean>, maxTimeout: number): Promise<void> => {
	return new Promise((resolve, reject) => {
		const unsubscribe = store.subscribe((value) => {
			if (value) {
				unsubscribe();
				resolve();
			}
		});

		setTimeout(() => {
			unsubscribe();
			reject(new Error('timeout'));
		}, maxTimeout);
	});
};
