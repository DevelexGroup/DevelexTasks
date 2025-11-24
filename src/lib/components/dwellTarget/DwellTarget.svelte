<script lang="ts">
	import { getContext, onDestroy, onMount, setContext } from 'svelte';
	import { type GazeInteractionObjectDwellEvent, GazeManager } from 'develex-js-sdk';
	import { DwellState } from '$lib/types/general.types';
	import DwellTargetEye from '$lib/components/dwellTarget/DwellTargetEye.svelte';
	import type { Snippet } from 'svelte';

	const CANCEL_TIMEOUT_MS = 300;
	const DWELL_TOLERANCE_MS = 100;
	const DEFAULT_SIZE_RATIO = 0.6;

	interface Props {
		id: string;
		dwellTimeMs?: number;
		onDwellComplete?: () => void;
		width?: number;
		height?: number;
		dwellState?: DwellState;
		bufferSize?: number;
		children?: Snippet;
	}

	let {
		id,
		dwellTimeMs = 800,
		onDwellComplete = () => {},
		width = 250,
		height = width * DEFAULT_SIZE_RATIO,
		bufferSize = 100,
		dwellState = $bindable(DwellState.Active) as DwellState,
		children
	}: Props = $props();

	// Set context so child components can access these props
	setContext('dwellTargetProps', {
		get dwellState() { return dwellState; },
		set dwellState(value: DwellState) { dwellState = value; },
		get dwellTimeMs() { return dwellTimeMs; },
		get width() { return width; },
		get height() { return height; }
	});

	let gazeManager = getContext<GazeManager>('gazeManager');

	let wrapperElement = $state<HTMLElement | null>(null);
	let isCooldownActive = $state(false);
	let cancelTimeout: number | null = null;

	onMount(() => {
		if (!wrapperElement || !gazeManager)
			return;
		gazeManager.on('dwell', handleDwellEvent);
		registerDwellTarget();
	});

	onDestroy(() => {
		if (!wrapperElement || !gazeManager)
			return;
		clearTimers();
		unregisterDwellTarget();
		gazeManager.off('dwell', handleDwellEvent);
	});

	function handleDwellEvent(e: GazeInteractionObjectDwellEvent) {
		if (!e.target.some((t) => t.id === id) || isCooldownActive)
			return;

		switch (e.type) {
			case 'dwellProgress': handleDwellProgress(); break;
			case 'dwellCancel': handleDwellCancel(); break;
			case 'dwellFinish': handleDwellFinish(); break;
		}
	}

	function handleDwellProgress() {
		if (dwellState === DwellState.Active) {
			dwellState = DwellState.ActiveDwelling;
		}
	}

	function handleDwellCancel() {
		if (dwellState !== DwellState.ActiveDwelling)
			return;

		clearTimers();
		dwellState = DwellState.DwellCancelled;
		isCooldownActive = true;

		unregisterDwellTarget();

		cancelTimeout = window.setTimeout(() => {
			registerDwellTarget();
			dwellState = DwellState.Active;
			isCooldownActive = false;
			cancelTimeout = null;
		}, CANCEL_TIMEOUT_MS);
	}

	function handleDwellFinish() {
		if (dwellState === DwellState.ActiveDwelling) {
			dwellState = DwellState.Disabled;
			onDwellComplete();
		}
	}

	function clearTimers() {
		if (cancelTimeout !== null) {
			clearTimeout(cancelTimeout);
			cancelTimeout = null;
		}
	}

	function registerDwellTarget() {
		if (!wrapperElement || !gazeManager)
			return;

		gazeManager.register({
			interaction: 'dwell',
			element: wrapperElement,
			settings: {
				dwellTime: dwellTimeMs,
				bufferSize: bufferSize,
				toleranceTime: DWELL_TOLERANCE_MS
			}
		});
	}

	function unregisterDwellTarget() {
		if (!wrapperElement || !gazeManager)
			return;

		gazeManager.unregister({
			interaction: 'dwell',
			element: wrapperElement
		});
	}
</script>

<div {id} bind:this={wrapperElement} style={`width: ${width}px; height: ${height}px;`}>
	{#if children}
		{@render children()}
	{:else}
		<DwellTargetEye />
	{/if}
</div>