import type { Readable } from 'svelte/store';

/**
 * Helper function to handle store subscription cleanup.
 * @param unsubscribers List of unsubscriber functions to cleanup
 */
const cleanup = (...unsubscribers: Array<() => void>) => {
	unsubscribers.forEach((unsubscribe) => unsubscribe && unsubscribe());
};

/**
 * Helper function that waits for a condition to be met.
 * @param store Success condition store
 * @param maxTimeout Timeout in milliseconds to wait for the condition
 * @param instantFailStore Optional store that triggers an instant fail condition
 * @returns Promise that resolves when the success condition is met, rejects if the timeout is reached or the instant fail condition is met
 */
export const waitForCondition = (
	store: Readable<boolean>,
	maxTimeout: number,
	instantFailStore?: Readable<boolean>
): Promise<void> => {
	return new Promise((resolve, reject) => {
		const unsubscribers: Array<() => void> = [];

		const onSuccess = (value: boolean) => {
			if (value) {
				cleanup(...unsubscribers);
				resolve();
			}
		};

		const onFail = (failValue: boolean) => {
			if (failValue) {
				cleanup(...unsubscribers);
				reject(new Error('Instant fail condition triggered.'));
			}
		};

		const onTimeout = () => {
			cleanup(...unsubscribers);
			reject(new Error(`Timeout waiting for condition: ${maxTimeout}ms`));
		};

		unsubscribers.push(store.subscribe(onSuccess));
		if (instantFailStore) {
			unsubscribers.push(instantFailStore.subscribe(onFail));
		}

		setTimeout(onTimeout, maxTimeout);
	});
};

/**
 * Helper function that waits for a timeout to pass.
 * @param maxTimeout Timeout in milliseconds to wait for
 * @returns Promise that resolves after the timeout
 */
export const waitForTimeout = (maxTimeout: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, maxTimeout));
