<script lang="ts">
	import { DwellState } from '$lib/types/general.types';
	import { Tween } from 'svelte/motion';
	import { cubicIn, cubicOut, linear } from 'svelte/easing';
	import type { EasingFunction } from 'svelte/transition';
	import { untilAbort } from '$lib/utils/untilAbort';
	import { onDestroy, onMount, getContext } from 'svelte';
	import DwellEye from '$lib/components/common/dwellTarget/eye/DwellEye.svelte';
	import { resolveAny } from '$lib/utils/resolveAny';

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
		width?: number;
		height?: number;
		defaultPupilProportion?: number;
		dwellTimeMs?: number;
		dwellState?: DwellState;
		pulseEnabled?: boolean;
	}

	let {
		width: widthProp,
		height: heightProp,
		defaultPupilProportion = 1,
		dwellTimeMs: dwellTimeMsProp,
		dwellState: dwellStateProp,
		pulseEnabled = true
	}: Props = $props();

	// Get context from parent DwellTarget
	const parentContext = getContext<{
		dwellState: DwellState;
		dwellTimeMs: number;
		width: number;
		height: number;
	} | undefined>('dwellTargetProps');

	// Use prop if provided, otherwise use context, otherwise use default
	const width = $derived(widthProp ?? parentContext?.width ?? 250);
	const height = $derived(heightProp ?? parentContext?.height ?? 150);
	const dwellTimeMs = $derived(dwellTimeMsProp ?? parentContext?.dwellTimeMs ?? 2000);
	let dwellState = $derived(dwellStateProp ?? parentContext?.dwellState ?? DwellState.Active);

	let wrapperElement: HTMLElement | null = null;

	let previousState: DwellState = dwellState;

	$effect(() => {
		wrapperElement?.style.setProperty('--dwell-time-ms', `${dwellTimeMs}ms`);

		if (dwellState === previousState)
			return;

		previousState = dwellState;
	});
</script>

<div
	bind:this={wrapperElement}
	class="dwell-target"
	class:disabled={dwellState === DwellState.Disabled}
	class:dwelling={dwellState === DwellState.ActiveDwelling}
	class:cancelled={dwellState === DwellState.DwellCancelled}
	style={`width: ${width}px; height: ${height}px;`}
>
	<img class="arrow--background" src={resolveAny('/images/common/dwell-arrow-grey.svg')} alt="&#8594;" />
	<img class="arrow--fill fill--bar" src={resolveAny('/images/common/dwell-arrow-fill.svg')} alt="" />
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

  .dwell-target img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.arrow--background {
		z-index: 1;
	}

  .arrow--fill {
		z-index: 2;
    pointer-events: none;
	}

	.arrow--fill.fill--bar {
    clip-path: inset(0 100% 0 0 round 999px);
	}

	.dwelling .arrow--fill.fill--bar {
    animation: dwell-bar-fill var(--dwell-time-ms) ease-out forwards;
	}

  @keyframes dwell-bar-fill {
    0% {
      clip-path: inset(0 100% 0 0 round 999px);
    }
    100% {
      clip-path: inset(0 0 0 0 round 999px);
    }
  }
</style>