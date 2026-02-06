<script lang="ts">
	import { getContext, onDestroy, onMount, setContext } from 'svelte';
	import { type GazeInteractionObjectDwellEvent, GazeManager } from 'develex-js-sdk';
	import { ANALYTICS_MANAGER_KEY, DwellState } from '$lib/types/general.types';
	import DwellTargetEye from '$lib/components/common/dwellTarget/DwellTargetEye.svelte';
	import type { Snippet } from 'svelte';
	import { GAZE_MANAGER_KEY } from '$lib/types/general.types';
	import type { AnalyticsManager } from '$lib/utils/analyticsManager';
	import { debugMode, debugOptions } from '$lib/stores/debug';

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
		disableOnComplete?: boolean;
		onCompleteCooldown?: number;
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
		disableOnComplete = true,
		onCompleteCooldown = 500,
		children
	}: Props = $props();

	// Set context so child components can access these props
	setContext('dwellTargetProps', {
		get dwellState() {
			return dwellState;
		},
		set dwellState(value: DwellState) {
			dwellState = value;
		},
		get dwellTimeMs() {
			return dwellTimeMs;
		},
		get width() {
			return width;
		},
		get height() {
			return height;
		}
	});

	let analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);
	let gazeManager = getContext<GazeManager>(GAZE_MANAGER_KEY);

	let wrapperElement = $state<HTMLElement | null>(null);
	let isCooldownActive = $state(false);
	let cancelTimeout: number | null = null;
	let isHovered = $state(false);

	function handleMouseMove(e: MouseEvent) {
		if (!wrapperElement || !($debugMode && $debugOptions.debugAOIAreaVisible)) return;

		const rect = wrapperElement.getBoundingClientRect();
		const expandedRect = {
			left: rect.left - bufferSize,
			right: rect.right + bufferSize,
			top: rect.top - bufferSize,
			bottom: rect.bottom + bufferSize
		};

		const wasHovered = isHovered;
		isHovered =
			e.clientX >= expandedRect.left &&
			e.clientX <= expandedRect.right &&
			e.clientY >= expandedRect.top &&
			e.clientY <= expandedRect.bottom;

		// Update body class for global dimming
		if (isHovered && !wasHovered) {
			document.body.dataset.gazeHoverCount = String(
				parseInt(document.body.dataset.gazeHoverCount || '0') + 1
			);
		} else if (!isHovered && wasHovered) {
			const count = parseInt(document.body.dataset.gazeHoverCount || '1') - 1;
			if (count <= 0) {
				delete document.body.dataset.gazeHoverCount;
			} else {
				document.body.dataset.gazeHoverCount = String(count);
			}
		}
	}

	onMount(() => {
		if (!wrapperElement || !gazeManager) return;
		gazeManager.on('dwell', handleDwellEvent);
		registerDwellTarget();
		document.addEventListener('mousemove', handleMouseMove);
	});

	onDestroy(() => {
		if (!wrapperElement || !gazeManager) return;
		clearTimers();
		unregisterDwellTarget();
		gazeManager.off('dwell', handleDwellEvent);
		document.removeEventListener('mousemove', handleMouseMove);

		// Clean up hover count if we were hovered
		if (isHovered) {
			const count = parseInt(document.body.dataset.gazeHoverCount || '1') - 1;
			if (count <= 0) {
				delete document.body.dataset.gazeHoverCount;
			} else {
				document.body.dataset.gazeHoverCount = String(count);
			}
		}
	});

	function handleDwellEvent(e: GazeInteractionObjectDwellEvent) {
		if (!e.target.some((t) => t.id === id) || isCooldownActive) return;

		switch (e.type) {
			case 'dwellProgress':
				handleDwellProgress();
				break;
			case 'dwellCancel':
				handleDwellCancel();
				break;
			case 'dwellFinish':
				handleDwellFinish();
				break;
		}
	}

	function handleDwellProgress() {
		if (dwellState === DwellState.Active) {
			analyticsManager.logEvent(`dwell-start_${id}`);
			dwellState = DwellState.ActiveDwelling;
		}
	}

	function handleDwellCancel() {
		if (dwellState !== DwellState.ActiveDwelling) return;

		clearTimers();
		dwellState = DwellState.DwellCancelled;
		analyticsManager.logEvent(`dwell-cancel_${id}`);
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
			if (!disableOnComplete) {
				setTimeout(() => {
					dwellState = DwellState.Active;
				}, onCompleteCooldown);
			}
			analyticsManager.logEvent(`dwell-finish_${id}`);
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
		if (!wrapperElement || !gazeManager) return;

		gazeManager.register({
			interaction: 'dwell',
			element: wrapperElement,
			settings: {
				dwellTime: dwellTimeMs,
				bufferSize: bufferSize,
				toleranceTime: DWELL_TOLERANCE_MS
			}
		});

		gazeManager.register({
			interaction: 'fixation',
			element: wrapperElement,
			settings: {
				bufferSize: bufferSize
			}
		});

		gazeManager.register({
			interaction: 'intersect',
			element: wrapperElement,
			settings: {
				bufferSize: bufferSize
			}
		});
	}

	function unregisterDwellTarget() {
		if (!wrapperElement || !gazeManager) return;

		gazeManager.unregister({
			interaction: 'dwell',
			element: wrapperElement
		});

		gazeManager.unregister({
			interaction: 'fixation',
			element: wrapperElement
		});

		gazeManager.unregister({
			interaction: 'intersect',
			element: wrapperElement
		});
	}
</script>

<div
	{id}
	bind:this={wrapperElement}
	class="dwell-target"
	class:visible={$debugMode && $debugOptions.debugAOIAreaVisible}
	class:hovered={isHovered}
	style:width="{width}px"
	style:height="{height}px"
	style:--buffer-size="{bufferSize}px"
	style:--debug-hue={(id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 137) % 360}
>
	{#if children}
		{@render children()}
	{:else}
		<DwellTargetEye />
	{/if}
</div>

<style>
	.dwell-target {
		position: relative;
	}

	/* Actual AOI outline */
	.visible::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		border: 2px solid hsl(var(--debug-hue), 80%, 50%);
		pointer-events: none;
		box-sizing: border-box;
		z-index: 1;
		transition: opacity 0.15s ease;
	}

	/* Buffer zone outline */
	.visible::before {
		content: '';
		position: absolute;
		top: calc(-1 * var(--buffer-size));
		left: calc(-1 * var(--buffer-size));
		right: calc(-1 * var(--buffer-size));
		bottom: calc(-1 * var(--buffer-size));
		border: 2px dashed hsl(var(--debug-hue), 80%, 50%);
		background: hsla(var(--debug-hue), 80%, 50%, 0.1);
		pointer-events: none;
		box-sizing: border-box;
		transition: opacity 0.15s ease;
	}

	/* Dim all areas when any buffer zone is hovered */
	:global(body[data-gaze-hover-count]) .visible::before,
	:global(body[data-gaze-hover-count]) .visible::after {
		opacity: 0.1;
	}

	/* Highlight the hovered areas */
	.visible.hovered::before,
	.visible.hovered::after {
		opacity: 1 !important;
	}
</style>
