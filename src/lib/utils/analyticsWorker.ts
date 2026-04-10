/**
 * Dedicated Web Worker for high-precision 120Hz polling timer.
 *
 * Runs a self-correcting setTimeout loop on a separate thread,
 * free from main-thread rendering, layout, and GC interference.
 *
 * Protocol:
 *   Main → Worker:  { type: 'start', intervalMs: number }
 *   Main → Worker:  { type: 'stop' }
 *   Worker → Main:  { type: 'tick' }
 */

let timer: ReturnType<typeof setTimeout> | null = null;
let nextTickTime = 0;
let intervalMs = 0;

function scheduleTick() {
	const now = performance.now();
	const delay = Math.max(0, nextTickTime - now);

	timer = setTimeout(() => {
		postMessage({ type: 'tick' });

		nextTickTime += intervalMs;

		// If we've fallen behind by more than 2 intervals, reset the anchor
		// to avoid a burst of rapid catch-up ticks
		if (performance.now() - nextTickTime > intervalMs * 2) {
			nextTickTime = performance.now() + intervalMs;
		}

		if (timer !== null) {
			scheduleTick();
		}
	}, delay);
}

self.onmessage = (e: MessageEvent) => {
	const { type } = e.data;

	if (type === 'start') {
		if (timer !== null) return; // already running
		intervalMs = e.data.intervalMs;
		nextTickTime = performance.now() + intervalMs;
		scheduleTick();
	} else if (type === 'stop') {
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
	}
};

