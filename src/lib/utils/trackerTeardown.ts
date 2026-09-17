import type { GazeManager } from 'develex-js-sdk';

let pendingTeardown: Promise<void> = Promise.resolve();

const attempt = async (step: () => Promise<unknown>) => {
	try {
		await step();
	} catch (error) {
		console.warn('Tracker teardown step failed:', error);
	}
};

// Each step waits for the Bridge response so the socket is closed only after Bridge finished stop and disconnect.
export const teardownTracker = (gazeManager: GazeManager): Promise<void> => {
	const input = gazeManager.input;

	if (!input) {
		return pendingTeardown;
	}

	pendingTeardown = pendingTeardown.then(async () => {
		await attempt(() => input.stop());
		await attempt(() => input.disconnect());
		await attempt(() => input.close());
		await attempt(() => input.destroy());
	});

	return pendingTeardown;
};

export const waitForTrackerTeardown = () => pendingTeardown;
