<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicIn, cubicOut, linear } from 'svelte/easing';
	import { onDestroy, onMount } from 'svelte';

	// Import DwellEye from relative path (assuming it's in the same directory)
	// If the file is actually elsewhere, adjust the path accordingly
	import DwellEye from './DwellTargetEye.svelte';

	type AnimationPhase = 'idle' | 'increase' | 'drop' | 'build' | 'complete';

	// Update type definition to include dwellCancelled
	type DwellState = 'active' | 'disabled' | 'activeDwelling' | 'dwellCancelled';

	let {
		// Core options
		eyeWidth = 250,
		eyeHeight = 150,
		defaultPupilProportion = 1,
		dwellTimeMs = 2000, // Time needed to complete the dwell in milliseconds
		dwellState = $bindable('active') as DwellState, // Make this bindable
		pulseEnabled = true,
		onDwellComplete = (newState: DwellState) => {}, // Function to call when dwell completes
		onStateChange = (newState: DwellState) => {} // Function to notify about state changes
	} = $props();

	// States for animation
	let dwellAnimationPhase = $state<AnimationPhase>('idle');
	let animationTimeoutId = $state<number | null>(null);
	let cancelTimeoutId = $state<number | null>(null);
	// Track previous state to avoid restarting animations unnecessarily
	let previousState = $state(dwellState);

	// Debug flag
	let initialized = $state(false);

	// Define colors for different states
	const colors: Record<DwellState, string> = {
		active: '#50C878', // Green
		disabled: '#888888', // Gray
		activeDwelling: '#50C878', // Same green as active
		dwellCancelled: '#FF6666' // Light red for cancelled state
	};

	// Calculate color based on state
	const pupilColor = $derived(colors[dwellState]);

	// Define all animation proportions
	const initialIncreaseProportion = $derived(defaultPupilProportion * 1.05); // Subtle initial increase
	const decreasedProportion = $derived(defaultPupilProportion * 0.4); // Dramatic decrease
	const finalIncreaseProportion = $derived(defaultPupilProportion + 0.12); // Subtle final increase

	// Animation timings - keep start and end phases constant
	const INITIAL_TRANSITION_MS = 100;
	const FINAL_TRANSITION_MS = 100;

	// Calculate actual build duration by subtracting fixed transitions
	const calculateBuildDuration = $derived(
		Math.max(dwellTimeMs - (2 * INITIAL_TRANSITION_MS + FINAL_TRANSITION_MS), 100)
	);

	// Tweened pupil proportion for smooth animations
	const pupilProportion = tweened(defaultPupilProportion, {
		duration: 300,
		easing: cubicOut
	});

	// Initialize after mount
	onMount(() => {
		initialized = true;
		console.log('DwellTarget mounted, state:', dwellState);
	});

	// Watch for state changes directly with $effect
	$effect(() => {
		console.log(
			'State changed:',
			dwellState,
			'Previous:',
			previousState,
			'Initialized:',
			initialized
		);

		// Skip the initial effect run
		if (!initialized) return;

		if (dwellState !== previousState) {
			previousState = dwellState;

			if (dwellState === 'activeDwelling') {
				console.log('Starting dwell animation');
				startDwellAnimation();
			} else if (dwellState === 'disabled' || dwellState === 'active') {
				console.log('Resetting dwell animation');
				resetDwellAnimation();
			} else if (dwellState === 'dwellCancelled') {
				console.log('Dwell cancelled, switching to red');
				resetDwellAnimation();

				// Clear any existing cancel timeout
				if (cancelTimeoutId !== null) {
					clearTimeout(cancelTimeoutId);
				}

				// Automatically switch back to active after 300ms
				cancelTimeoutId = window.setTimeout(() => {
					console.log('Cancelled timeout over, returning to active');
					previousState = 'active'; // Update this first to prevent circular updates
					dwellState = 'active';
				}, 300);
			}

			// Notify parent about state changes
			onStateChange(dwellState);
		}
	});

	// Start the dwelling animation sequence
	function startDwellAnimation() {
		// Clear any existing animation
		clearAnimationTimeout();
		dwellAnimationPhase = 'increase';
		console.log('Phase 1: subtle increase to', initialIncreaseProportion);

		// Phase 1: Start with a subtle increase - fixed timing
		pupilProportion.set(initialIncreaseProportion, {
			duration: INITIAL_TRANSITION_MS,
			easing: cubicOut
		});

		// Phase 2: Dramatic decrease - fixed timing
		animationTimeoutId = window.setTimeout(() => {
			dwellAnimationPhase = 'drop';
			console.log('Phase 2: dramatic decrease to', decreasedProportion);

			pupilProportion.set(decreasedProportion, {
				duration: INITIAL_TRANSITION_MS,
				easing: cubicIn
			});

			// Phase 3: Slow build up to completion - dynamic timing based on dwellTimeMs
			animationTimeoutId = window.setTimeout(() => {
				dwellAnimationPhase = 'build';
				console.log(
					'Phase 3: build to',
					finalIncreaseProportion,
					'over',
					calculateBuildDuration,
					'ms (adjusted from',
					dwellTimeMs,
					'ms total)'
				);

				// Slowly increase to slightly larger than default over adjusted dwell time
				pupilProportion.set(finalIncreaseProportion, {
					duration: calculateBuildDuration,
					easing: linear
				});

				// Phase 4: Complete - fixed timing
				animationTimeoutId = window.setTimeout(() => {
					dwellAnimationPhase = 'complete';
					console.log('Phase 4: complete');

					// Update pupil proportion back to default
					pupilProportion.set(defaultPupilProportion, { duration: FINAL_TRANSITION_MS });

					// Auto-switch to disabled - use a separate timeout to avoid triggering effects in the same cycle
					window.setTimeout(() => {
						console.log('Switching to disabled state');
						// Only update if we're still in activeDwelling state
						if (previousState === 'activeDwelling') {
							previousState = 'disabled'; // Update this first to prevent circular updates
							dwellState = 'disabled';
							// Notify about completion
							onDwellComplete(dwellState);
						}
					}, 50);
				}, calculateBuildDuration);
			}, INITIAL_TRANSITION_MS);
		}, INITIAL_TRANSITION_MS);
	}

	// Reset animation state
	function resetDwellAnimation() {
		clearAnimationTimeout();
		dwellAnimationPhase = 'idle';
		pupilProportion.set(defaultPupilProportion, { duration: 300 });
	}

	// Clean up timeouts
	function clearAnimationTimeout() {
		if (animationTimeoutId !== null) {
			window.clearTimeout(animationTimeoutId);
			animationTimeoutId = null;
		}
	}

	onDestroy(() => {
		clearAnimationTimeout();
		if (cancelTimeoutId !== null) {
			clearTimeout(cancelTimeoutId);
		}
	});
</script>

<div
	class="dwell-target"
	class:disabled={dwellState === 'disabled'}
	class:dwelling={dwellState === 'activeDwelling'}
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
</style>
