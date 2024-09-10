import type { Readable } from 'svelte/store';

export const waitForCondition = (
	store: Readable<boolean>,
	maxTimeout: number,
	instantFailStore?: Readable<boolean> // Optional instant fail condition store
): Promise<void> => {
	return new Promise((resolve, reject) => {
		let unsubscribe: () => void = () => {};
		let unsubscribeFail: () => void = () => {};

		// Subscribe to the main store (success condition)
		unsubscribe = store.subscribe((value) => {
			if (value) {
				unsubscribe(); // Unsubscribe and resolve if success condition is met
				if (unsubscribeFail) unsubscribeFail(); // Cleanup instant fail listener if present
				resolve();
			}
		});

		// Subscribe to the instant fail store (fail condition)
		if (instantFailStore) {
			unsubscribeFail = instantFailStore.subscribe((failValue) => {
				if (failValue) {
					unsubscribe(); // Cleanup success listener if fail condition is met
					unsubscribeFail();
					reject(new Error('Instant fail condition triggered.'));
				}
			});
		}

		// Timeout to reject the promise if the success condition is not met in time
		setTimeout(() => {
			unsubscribe();
			if (unsubscribeFail) unsubscribeFail();
			reject(new Error('Timeout waiting for condition: ' + maxTimeout));
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
