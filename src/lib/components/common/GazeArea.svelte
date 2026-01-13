<script lang="ts">
	import { GAZE_MANAGER_KEY } from '$lib/types/general.types';
	import type { GazeManager	} from 'develex-js-sdk';
	import { getContext, onDestroy, onMount, type Snippet } from 'svelte';
	import { debugMode, debugOptions } from '$lib/stores/debug';

	interface Props {
		id: string;
		registerFixation?: boolean;
		registerIntersect?: boolean;
		bufferSize?: number;
		children: Snippet;
	}

	let {
		id,
		registerFixation = true,
		registerIntersect = true,
		bufferSize = 100,
		children
	}: Props = $props();

	const gazeManager = getContext<GazeManager>(GAZE_MANAGER_KEY);

	let element = $state<HTMLElement | null>(null);
	let isHovered = $state(false);

	function handleMouseMove(e: MouseEvent) {
		if (!element || !($debugMode && $debugOptions.debugAOIAreaVisible)) return;

		const rect = element.getBoundingClientRect();
		const expandedRect = {
			left: rect.left - bufferSize,
			right: rect.right + bufferSize,
			top: rect.top - bufferSize,
			bottom: rect.bottom + bufferSize
		};

		const wasHovered = isHovered;
		isHovered = e.clientX >= expandedRect.left &&
					e.clientX <= expandedRect.right &&
					e.clientY >= expandedRect.top &&
					e.clientY <= expandedRect.bottom;

		// Update body class for global dimming
		if (isHovered && !wasHovered) {
			document.body.dataset.gazeHoverCount = String((parseInt(document.body.dataset.gazeHoverCount || '0') + 1));
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
		if (!element)
			return;

		if (registerFixation) {
			gazeManager.register({
				interaction: 'fixation',
				element,
				settings: { bufferSize }
			});
		}
		if (registerIntersect) {
			gazeManager.register({
				interaction: 'intersect',
				element,
				settings: { bufferSize }
			});
		}

		document.addEventListener('mousemove', handleMouseMove);
	});

	$effect(() => {
		if (!element || !$debugMode) return;
		bufferSize = $debugOptions.debugAOIBufferSize;
	});

	onDestroy(() => {
		if (!element)
			return;

		if (registerFixation) {
			gazeManager.unregister({
				interaction: 'fixation',
				element
			});
		}
		if (registerIntersect) {
			gazeManager.unregister({
				interaction: 'intersect',
				element
			});
		}

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
</script>

<div
	id={id}
	bind:this={element}
	class="gaze-area"
	class:visible={$debugMode && $debugOptions.debugAOIAreaVisible}
	class:hovered={isHovered}
	style:--buffer-size="{bufferSize}px"
	style:--debug-hue="{(id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 137) % 360}"
	role="group"
>
	{@render children()}
</div>

<style>
	.gaze-area {
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