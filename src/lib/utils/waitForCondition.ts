import type { Readable } from 'svelte/store';

export const waitForCondition = (store: Readable<boolean>, maxTimeout: number): Promise<void> => {
	return new Promise((resolve, reject) => {
		// Initialize `unsubscribe` to an empty function
		let unsubscribe: () => void = () => {};

		// Define `unsubscribe` within the subscription callback
		unsubscribe = store.subscribe((value) => {
			if (value) {
				unsubscribe(); // Unsubscribe and resolve if condition is met
				resolve();
			}
		});

		// Timeout to reject the promise if the condition is not met in time
		setTimeout(() => {
			unsubscribe();
			reject(new Error('timeout waiting for condition for: ' + maxTimeout));
		}, maxTimeout);
	});
};

export const waitForTimeout = (maxTimeout: number): Promise<void> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, maxTimeout);
	});
};
