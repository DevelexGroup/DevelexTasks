import type { Readable } from 'svelte/store';

/**
 * Helper function to handle store subscription cleanup.
 * @param unsubscribers List of unsubscriber functions to cleanup
 */
const cleanup = (...unsubscribers: Array<() => void>) => {
	unsubscribers.forEach((unsubscribe) => unsubscribe && unsubscribe());
};

const cleanTimeout = (timeout: number | null) => {
	if (timeout != null) {
		clearTimeout(timeout);
	}
};

class TimeoutError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'TimeoutError';
	}
}

class InstantFailError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'InstantFailError';
	}
}

/**
 * Helper function that waits for a condition to be met.
 * @param store Success condition store
 * @param maxTimeout Timeout in milliseconds to wait for the condition
 * @param instantFailStore Optional store that triggers an instant fail condition
 * @returns Promise that resolves when the success condition is met, rejects if the timeout is reached or the instant fail condition is met
 * @throws {TimeoutError} When the timeout is reached
 * @throws {InstantFailError} When the instant fail condition is met
 */
export const waitForCondition = (
	store: Readable<boolean>,
	maxTimeout: number,
	instantFailStore?: Readable<boolean>
): Promise<void> => {
	return new Promise((resolve, reject) => {
		const unsubscribers: Array<() => void> = [];
		let timeout: number | null = null;

		const onSuccess = (value: boolean) => {
			if (value) {
				cleanTimeout(timeout);
				cleanup(...unsubscribers);
				resolve();
			}
		};

		const onFail = (failValue: boolean) => {
			if (failValue) {
				cleanTimeout(timeout);
				cleanup(...unsubscribers);
				reject(new InstantFailError('Instant fail condition met'));
			}
		};

		const onTimeout = () => {
			cleanup(...unsubscribers);
			reject(new TimeoutError('Timeout reached after ' + maxTimeout + 'ms'));
		};

		unsubscribers.push(store.subscribe(onSuccess));
		if (instantFailStore) {
			unsubscribers.push(instantFailStore.subscribe(onFail));
		}

		timeout = setTimeout(onTimeout, maxTimeout);
	});
};

export const waitForConditionNoTimeout = (
	store: Readable<boolean>,
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
				reject(new InstantFailError('Instant fail condition met'));
			}
		};

		unsubscribers.push(store.subscribe(onSuccess));
		if (instantFailStore) {
			unsubscribers.push(instantFailStore.subscribe(onFail));
		}
	});
};

/**
 * Helper function that waits for a timeout to pass.
 * @param maxTimeout Timeout in milliseconds to wait for
 * @returns Promise that resolves after the timeout
 */
export const waitForTimeout = (maxTimeout: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, maxTimeout));

/**
 * Utility function to make any async operation cancellable by an AbortSignal.
 * @param asyncFunction - The async function to wrap and make cancellable
 * @param signal - An AbortSignal used to cancel the operation
 * @returns A Promise that is cancellable via the provided AbortSignal
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AbortController
 */
export const getCancellableAsync = <T>(
	asyncFunction: () => Promise<T>,
	signal: AbortSignal
): Promise<T> =>
	new Promise((resolve, reject) => {
		if (signal.aborted) return reject(signal.reason);

		const onAbort = () => reject(signal.reason);
		signal.addEventListener('abort', onAbort);

		asyncFunction()
			.then(resolve)
			.catch(reject)
			.finally(() => signal.removeEventListener('abort', onAbort));
	});

/**
 * Helper function that waits for a condition to be met, cancellable by an AbortSignal.
 * @param store Success condition store
 * @param maxTimeout Timeout in milliseconds to wait for the condition
 * @param signal AbortSignal to cancel the operation
 * @param instantFailStore Optional store that triggers an instant fail condition
 * @returns Promise that resolves when the success condition is met, rejects if the timeout is reached or the instant fail condition is met, or if the signal is aborted.
 * @throws {TimeoutError} When the timeout is reached
 * @throws {InstantFailError} When the instant fail condition is met
 */
export const waitForConditionCancellable = (
	store: Readable<boolean>,
	maxTimeout: number,
	signal: AbortSignal,
	instantFailStore?: Readable<boolean>
): Promise<void> => {
	return getCancellableAsync(() => waitForCondition(store, maxTimeout, instantFailStore), signal);
};
