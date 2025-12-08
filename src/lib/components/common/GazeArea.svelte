<script lang="ts">
	import { GAZE_MANAGER_KEY } from '$lib/types/general.types';
	import type { GazeManager	} from 'develex-js-sdk';
	import { getContext, onDestroy, onMount, type Snippet } from 'svelte';

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
	});
</script>

<div id={id} bind:this={element}>
	{@render children()}
</div>