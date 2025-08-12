<script lang="ts">
	import type { GazeManager, GazeInteractionObjectDwellEvent } from 'develex-js-sdk';
	import DwellTargetAnimator from './DwellTargetAnimator.svelte';
	import { onMount, onDestroy } from 'svelte';

	// Define DwellState type first to fix type errors
	type DwellState = 'active' | 'disabled' | 'activeDwelling' | 'dwellCancelled';

	interface Props {
		gazeManager: GazeManager;
		id: string;
		dwellTimeMs?: number;
		onDwellComplete?: (newState: DwellState) => void;
		eyeWidth?: number;
		eyeHeight?: number;
		dwellState?: DwellState;
		bufferSize?: number;
	}

	let {
		gazeManager,
		id,
		dwellTimeMs = 800,
		onDwellComplete = () => {},
		eyeWidth = 250,
		eyeHeight = 150,
		bufferSize = 100,
		dwellState = $bindable('active') as DwellState
	}: Props = $props();

	let element = $state<HTMLElement | null>(null);
	let isDwelling = $state(false);
	let internalStateChange = $state(false);
	let cooldownActive = $state(false); // Track when we're in cooldown after cancellation
	let cancelTimeout: number | null = null;
	let registrationTimeout: number | null = null; // Add reference for registration timer

	// Handler for dwell events
	function evaluateDwell(e: GazeInteractionObjectDwellEvent) {
		// Skip if element doesn't match our target or in cooldown
		if (!e.target.some((t) => t.id === id) || cooldownActive) {
			return;
		}

		// Handle the different event types
		if (e.type === 'dwellProgress') {
			// Only update if state is changing and we're in active state
			if (dwellState === 'active' && !isDwelling) {
				internalStateChange = true;
				dwellState = 'activeDwelling';
				isDwelling = true;
				internalStateChange = false;
			}
		} else if (e.type === 'dwellCancel') {
			// Only update if we were dwelling
			if (isDwelling) {
				handleDwellCancel();
			}
		} else if (e.type === 'dwellFinish') {
			// Dwell completed
			if (isDwelling) {
				// Call the completion callback
				if (typeof onDwellComplete === 'function') {
					onDwellComplete(dwellState);
				}

				// Set state to disabled
				internalStateChange = true;
				dwellState = 'disabled';
				isDwelling = false;
				internalStateChange = false;
			}
		}
	}

	// Handle dwell cancellation with cooldown period
	function handleDwellCancel() {
		// Update state
		internalStateChange = true;
		dwellState = 'dwellCancelled';
		isDwelling = false;
		internalStateChange = false;

		// Enter cooldown to ignore events temporarily
		cooldownActive = true;

		// Unregister the element from gaze manager
		if (element && gazeManager) {
			gazeManager.unregister({
				interaction: 'dwell',
				element
			});
		}

		// Clear any existing registration timer
		if (registrationTimeout) {
			clearTimeout(registrationTimeout);
			registrationTimeout = null;
		}

		// Set timeout to re-register after 200ms
		registrationTimeout = window.setTimeout(() => {
			if (element && gazeManager) {
				// Re-register the element
				gazeManager.register({
					interaction: 'dwell',
					element,
					settings: {
						dwellTime: dwellTimeMs,
						bufferSize: bufferSize
					}
				});
			}
			registrationTimeout = null;
		}, 200);

		// Set timeout to exit cooldown and reset state
		if (cancelTimeout) clearTimeout(cancelTimeout);
		cancelTimeout = window.setTimeout(() => {
			// Reset state to active
			internalStateChange = true;
			dwellState = 'active';
			internalStateChange = false;

			// End cooldown
			cooldownActive = false;
			cancelTimeout = null;
		}, 300); // 300ms cooldown before accepting new dwell events
	}

	// Watch for external state changes
	$effect(() => {
		// Ignore internal state changes we initiated
		if (internalStateChange) return;

		// Update internal tracking based on external dwellState changes
		isDwelling = dwellState === 'activeDwelling';
	});

	// Register with gaze manager on mount
	onMount(() => {
		if (!element || !gazeManager) return;

		// Add event handler
		gazeManager.on('dwell', evaluateDwell);

		// Register the element
		gazeManager.register({
			interaction: 'dwell',
			element,
			settings: {
				dwellTime: dwellTimeMs,
				bufferSize: bufferSize,
				toleranceTime: 100 // 100ms tolerance for dwell events
			}
		});
	});

	// Clean up on component destruction
	onDestroy(() => {
		if (cancelTimeout) {
			clearTimeout(cancelTimeout);
			cancelTimeout = null;
		}

		if (registrationTimeout) {
			clearTimeout(registrationTimeout);
			registrationTimeout = null;
		}

		if (element && gazeManager) {
			// Unregister from gaze manager
			gazeManager.unregister({
				interaction: 'dwell',
				element
			});

			// Remove event handler
			gazeManager.off('dwell', evaluateDwell);
		}
	});
</script>

<div {id} bind:this={element} style={`width: ${eyeWidth}px; height: ${eyeHeight}px;`}>
	<DwellTargetAnimator {dwellTimeMs} bind:dwellState {eyeWidth} {eyeHeight} {onDwellComplete} />
</div>
