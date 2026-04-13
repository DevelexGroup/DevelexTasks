/**
 * Dedicated Web Worker for high-precision 120Hz polling timer.
 *
 * Uses a SharedArrayBuffer written by the main thread on every eyetracker
 * inputData event. At each tick the worker reads gaze position atomically
 * before posting the message — the position is captured at the exact scheduled
 * tick moment rather than after the thread-boundary round-trip.
 *
 * SharedArrayBuffer layout (Int32Array, 3 elements):
 *   [0]  eyetracker x × 100  (scaled integer, preserves 0.01px precision)
 *   [1]  eyetracker y × 100
 *   [2]  parseValidity        (1 = valid, 0 = invalid)
 *
 * Protocol:
 *   Main → Worker:  { type: 'start', intervalMs: number, gazeBuf: SharedArrayBuffer }
 *   Main → Worker:  { type: 'stop' }
 *   Worker → Main:  { type: 'tick', timestamp: number (Unix ms), x: number, y: number, valid: number }
 */

let timer: ReturnType<typeof setTimeout> | null = null;
let nextTickTime = 0;
let intervalMs = 0;
let gazeArray: Int32Array | null = null;

function scheduleTick() {
	const now = performance.now();
	const delay = Math.max(0, nextTickTime - now);

	timer = setTimeout(() => {
		// Read gaze position atomically at the exact tick moment — before
		// postMessage, so the captured values reflect this scheduled instant.
		let x = 0, y = 0, valid = 0;
		if (gazeArray !== null) {
			x     = Atomics.load(gazeArray, 0) / 100;
			y     = Atomics.load(gazeArray, 1) / 100;
			valid = Atomics.load(gazeArray, 2);
		}

		// Send the *scheduled* tick time as the sample timestamp so
		// consecutive samples are spaced exactly intervalMs apart.
		postMessage({ type: 'tick', timestamp: performance.timeOrigin + nextTickTime, x, y, valid });

		nextTickTime += intervalMs;

		// If we've fallen behind by more than 2 intervals, reset the anchor
		// to avoid a burst of rapid catch-up ticks.
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
		if (typeof SharedArrayBuffer !== 'undefined' && e.data.gazeBuf instanceof SharedArrayBuffer) {
			gazeArray = new Int32Array(e.data.gazeBuf);
		}
		nextTickTime = performance.now() + intervalMs;
		scheduleTick();
	} else if (type === 'stop') {
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
	}
};
