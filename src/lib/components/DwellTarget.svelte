<script lang="ts">
	import type { GazeManager, GazeInteractionObjectDwellEvent } from '@473783/develex-core';
	import DwellTargetAnimator from './DwellTargetAnimator.svelte';
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		gazeManager: GazeManager;
		id: string;
		dwellTimeMs?: number;
		onDwellComplete?: (newState: DwellState) => void;
		eyeWidth?: number;
		eyeHeight?: number;
	}

	let {
		gazeManager,
		id,
		dwellTimeMs = 800,
		onDwellComplete = () => {},
		eyeWidth = 250,
		eyeHeight = 150
	}: Props = $props();

	let element = $state<HTMLElement | null>(null);

	type DwellState = 'active' | 'disabled' | 'activeDwelling' | 'dwellCancelled';
	let dwellState = $state<DwellState>('active');

	const evaluateDwell = (e: GazeInteractionObjectDwellEvent) => {
		// If in active state and start of dwell, set to activeDwelling
		if (dwellState === 'active' && e.type === 'dwellProgress') {
			dwellState = 'activeDwelling';
		}
		// If dwell cancel while dwelling, set to active again
		if (dwellState === 'activeDwelling' && e.type === 'dwellCancel') {
			dwellState = 'dwellCancelled';
		}
	};

	onMount(() => {
		if (!element) return;
		gazeManager.register({
			interaction: 'dwell',
			element,
			settings: {
				dwellTime: dwellTimeMs
			}
		});

		gazeManager.on('dwell', evaluateDwell);
	});

	onDestroy(() => {
		if (!element) return;
		gazeManager.unregister({
			interaction: 'dwell',
			element
		});
	});
</script>

<div {id} bind:this={element} style={`width: ${eyeWidth}px; height: ${eyeHeight}px;`}>
	<DwellTargetAnimator {dwellTimeMs} {onDwellComplete} bind:dwellState {eyeWidth} {eyeHeight} />
</div>
