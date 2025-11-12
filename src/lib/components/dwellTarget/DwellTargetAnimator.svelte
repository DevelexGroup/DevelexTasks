<script lang="ts">
	import { DwellState } from '$lib/types/general.types';
	import { Tween } from 'svelte/motion';
	import { cubicIn, cubicOut, linear } from 'svelte/easing';
	import type { EasingFunction } from 'svelte/transition';
	import { untilAbort } from '$lib/utils/untilAbort';
	import { onDestroy, onMount } from 'svelte';
	import DwellTargetEye from '$lib/components/dwellTarget/DwellTargetEye.svelte';

	const colors: Record<DwellState, string> = {
		[DwellState.Active]: '#50C878',
		[DwellState.Disabled]: '#888888',
		[DwellState.ActiveDwelling]: '#50C878',
		[DwellState.DwellCancelled]: '#FF6666'
	};

	const INITIAL_TRANSITION_MS = 100;
	const FINAL_TRANSITION_MS = 100;
	const RESET_TRANSITION_MS = 150;

	interface Props {
		eyeWidth?: number;
		eyeHeight?: number;
		defaultPupilProportion?: number;
		dwellTimeMs?: number;
		dwellState?: DwellState;
		pulseEnabled?: boolean;
	}

	let {
		eyeWidth = 250,
		eyeHeight = 150,
		defaultPupilProportion = 1,
		dwellTimeMs = 2000,
		dwellState = $bindable(DwellState.Active) as DwellState,
		pulseEnabled = true
	}: Props = $props();

	const initialIncreaseProportion = $derived(defaultPupilProportion * 1.05);
	const decreasedProportion = $derived(defaultPupilProportion * 0.4);
	const finalIncreaseProportion = $derived(defaultPupilProportion + 0.12);

	const pupilColor = $derived(colors[dwellState]);

	const buildDuration = $derived(
		Math.max(dwellTimeMs - (2 * INITIAL_TRANSITION_MS + FINAL_TRANSITION_MS), 100)
	);

	const pupilProportion = new Tween(defaultPupilProportion, {
		duration: 300,
		easing: cubicOut
	});

	let previousState: DwellState = dwellState;
	let animationAbortController: AbortController | null = null;

	onMount(() => {
		pupilProportion.set(defaultPupilProportion, { duration: 0 });
	});

	onDestroy(() => {
		resetAnimation();
	});

	$effect(() => {
		if (dwellState === previousState)
			return;

		resetAnimation();

		if (dwellState === DwellState.ActiveDwelling && previousState === DwellState.Active) {
			animationAbortController = new AbortController();
			startDwellAnimation(animationAbortController.signal);
		}

		previousState = dwellState;
	});

	async function startDwellAnimation(signal?: AbortSignal) {
		const setProportion = (proportion: number, duration: number, easing: EasingFunction): Promise<void> => {
			return untilAbort(pupilProportion.set(proportion, { duration, easing }), signal);
		};

		try {
			await setProportion(initialIncreaseProportion, INITIAL_TRANSITION_MS, cubicOut);
			await setProportion(decreasedProportion, INITIAL_TRANSITION_MS, cubicIn);
			await setProportion(finalIncreaseProportion, buildDuration, linear);
			await setProportion(defaultPupilProportion, FINAL_TRANSITION_MS, linear);
		} catch (e) {
			if (e instanceof DOMException && e.name === 'AbortError') {
				pupilProportion.set(defaultPupilProportion, { duration: RESET_TRANSITION_MS, easing: linear });
				return;
			}
			throw e;
		}
	}

	function resetAnimation() {
		if (animationAbortController) {
			animationAbortController.abort();
			animationAbortController = null;
		}
	}
</script>

<div
	class="dwell-target"
	class:disabled={dwellState === DwellState.Disabled}
	class:dwelling={dwellState === DwellState.ActiveDwelling}
	class:cancelled={dwellState === DwellState.DwellCancelled}
	style={`width: ${eyeWidth}px; height: ${eyeHeight}px;`}
>
	<DwellTargetEye
		{eyeWidth}
		{eyeHeight}
		pupilProportion={pupilProportion.current}
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