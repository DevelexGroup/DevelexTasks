import { waitForTimeout } from './waitForCondition';

export interface RetryOptions {
	retries: number;
	delay: number;
	onRetry?: (error: unknown, attempt: number) => void;
	shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export const retry = async <T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> => {
	const { retries, delay, shouldRetry = () => true, onRetry = () => {} } = options;
	let attempt = 0;

	while (attempt < retries) {
		try {
			return await fn();
		} catch (error: unknown) {
			attempt++;
			if (attempt >= retries || !shouldRetry(error, attempt)) {
				throw error;
			}
			onRetry(error, attempt);
			await waitForTimeout(delay);
		}
	}

	throw new Error('Function failed after maximum retries');
};
