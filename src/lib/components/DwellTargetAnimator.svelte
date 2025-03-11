<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicIn, cubicOut, linear } from 'svelte/easing';
	import { onDestroy, onMount } from 'svelte';

	// Import DwellEye component
	import DwellEye from './DwellTargetEye.svelte';

	// Animation phases
	type AnimationPhase = 'idle' | 'increase' | 'drop' | 'build' | 'complete';

	// Dwell states
	type DwellState = 'active' | 'disabled' | 'activeDwelling' | 'dwellCancelled';

	let {
		// Core options
		eyeWidth = 250,
		eyeHeight = 150,
		defaultPupilProportion = 1,
		dwellTimeMs = 2000, // Time needed to complete the dwell in milliseconds
		dwellState = $bindable('active') as DwellState, // Make this bindable
		pulseEnabled = true,
		onDwellComplete = (newState: DwellState) => {} // Function to call when dwell completes
	} = $props();

	// Internal state management
	let dwellAnimationPhase = $state<AnimationPhase>('idle');
	let previousState = $state<DwellState>(dwellState);
	let initialized = $state(false);

	// Array to track all timeouts for proper cleanup
	let timeouts = $state<number[]>([]);

	// Define colors for different states
	const colors: Record<DwellState, string> = {
		active: '#50C878', // Green
		disabled: '#888888', // Gray
		activeDwelling: '#50C878', // Same green as active
		dwellCancelled: '#FF6666' // Light red for cancelled state
	};

	// Calculate color based on state
	const pupilColor = $derived(colors[dwellState]);

	// Define animation proportions
	const initialIncreaseProportion = $derived(defaultPupilProportion * 1.05);
	const decreasedProportion = $derived(defaultPupilProportion * 0.4);
	const finalIncreaseProportion = $derived(defaultPupilProportion + 0.12);

	// Animation timings - keep start and end phases constant
	const INITIAL_TRANSITION_MS = 100;
	const FINAL_TRANSITION_MS = 100;

	// Calculate actual build duration by subtracting fixed transitions
	const buildDuration = $derived(
		Math.max(dwellTimeMs - (2 * INITIAL_TRANSITION_MS + FINAL_TRANSITION_MS), 100)
	);

	// Tweened pupil proportion for smooth animations
	const pupilProportion = tweened(defaultPupilProportion, {
		duration: 300,
		easing: cubicOut
	});

	// Safe setTimeout wrapper that tracks IDs for cleanup
	function safeTimeout(callback: () => void, delay: number) {
		const id = window.setTimeout(callback, delay);
		timeouts = [...timeouts, id];
		return id;
	}

	// Clear all timeouts
	function clearAllTimeouts() {
		timeouts.forEach((id) => window.clearTimeout(id));
		timeouts = [];
	}

	// Watch for dwell state changes
	$effect(() => {
		// Skip initial effect run
		if (!initialized) return;

		// Only process when state actually changes
		if (dwellState === previousState) return;

		// Store new state and process the change
		const oldState = previousState;
		previousState = dwellState;

		// Clean up any existing animations
		clearAllTimeouts();

		// Only start animation if we're transitioning TO activeDwelling from active
		if (dwellState === 'activeDwelling' && oldState === 'active') {
			startDwellAnimation();
		}
		// Handle cancellation state with immediate animation reset
		else if (dwellState === 'dwellCancelled') {
			// Immediately reset the animation to show cancellation
			handleCancelledDwell();
		}
		// Handle transition to active state (after cancellation or from disabled)
		else if (dwellState === 'active') {
			// Reset animation for active state
			resetAnimation();
		}
		// Handle transition to disabled state
		else if (dwellState === 'disabled') {
			// Reset animation for disabled state
			resetAnimation();
		}
	});

	// Start the dwelling animation sequence
	function startDwellAnimation() {
		// Reset any existing animation state
		clearAllTimeouts();
		dwellAnimationPhase = 'increase';

		// Phase 1: Subtle increase
		pupilProportion.set(initialIncreaseProportion, {
			duration: INITIAL_TRANSITION_MS,
			easing: cubicOut
		});

		// Phase 2: Dramatic decrease
		safeTimeout(() => {
			dwellAnimationPhase = 'drop';

			pupilProportion.set(decreasedProportion, {
				duration: INITIAL_TRANSITION_MS,
				easing: cubicIn
			});

			// Phase 3: Build up
			safeTimeout(() => {
				dwellAnimationPhase = 'build';

				// Slow build up over the dwell time
				pupilProportion.set(finalIncreaseProportion, {
					duration: buildDuration,
					easing: linear
				});

				// Phase 4: Completion
				safeTimeout(() => {
					dwellAnimationPhase = 'complete';

					// Update pupil proportion back to default
					pupilProportion.set(defaultPupilProportion, {
						duration: FINAL_TRANSITION_MS
					});
				}, buildDuration);
			}, INITIAL_TRANSITION_MS);
		}, INITIAL_TRANSITION_MS);
	}

	// Handle the cancelled dwell state
	function handleCancelledDwell() {
		// Clear all timeouts to stop any ongoing animations
		clearAllTimeouts();

		// Set animation phase to idle
		dwellAnimationPhase = 'idle';

		// Immediately reset pupil size with a short transition
		pupilProportion.set(defaultPupilProportion, { duration: 150 });
	}

	// Reset animation to default state
	function resetAnimation() {
		clearAllTimeouts();
		dwellAnimationPhase = 'idle';
		pupilProportion.set(defaultPupilProportion, { duration: 150 });
	}

	// Initialize on mount
	onMount(() => {
		initialized = true;

		// Set initial pupil size without animation
		pupilProportion.set(defaultPupilProportion, { duration: 0 });
	});

	// Clean up all animations on component destroy
	onDestroy(() => {
		clearAllTimeouts();
		initialized = false;
	});
</script>

<div
	class="dwell-target"
	class:disabled={dwellState === 'disabled'}
	class:dwelling={dwellState === 'activeDwelling'}
	class:cancelled={dwellState === 'dwellCancelled'}
	style={`width: ${eyeWidth}px; height: ${eyeHeight}px;`}
>
	<DwellEye
		{eyeWidth}
		{eyeHeight}
		pupilProportion={$pupilProportion}
		{pupilColor}
		colorTransitionDuration={0.3}
		{pulseEnabled}
	/>
</div>

<style>
	.dwell-target {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: opacity 0.3s ease;
	}

	.disabled {
		opacity: 0.7;
		cursor: default;
	}

	.cancelled {
		opacity: 0.9;
	}
</style>
