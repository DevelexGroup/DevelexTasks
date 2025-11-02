<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { GazeInteractionObjectDwellEvent, GazeManager } from 'develex-js-sdk';
	import { getContext, onMount } from 'svelte';

	const id = 'testik';

	let gazeManager = getContext<GazeManager>('gazeManager');
	let element = $state<HTMLElement | null>(null);
	let dwelled = $state<boolean>(false);

	const handleDwell = (event: GazeInteractionObjectDwellEvent) => {
		console.log(event);
		if (!event.target.some((t) => t.id === id)) {
			return;
		}

		if (event.type == 'dwellFinish') {
			dwelled = true;
		}
	};

	onMount(() => {
		if (!element) {
			return;
		}

		gazeManager.on('dwell', handleDwell);

		gazeManager.register({
			interaction: 'dwell',
			element,
			settings: {
				dwellTime: 1500,
				bufferSize: 50
			}
		});

		return () => {
			gazeManager.off('dwell', handleDwell);

			if (element) {
				gazeManager.unregister({
					interaction: 'dwell',
					element: element
				});
			}
		};
	});
</script>

<div class="flex h-screen w-full items-center justify-center">
	<div bind:this={element} {id}>
		<Icon icon="material-symbols:eye-tracking-outline-rounded" class="h-12 w-12 text-blue-700" />
	</div>

	{#if dwelled}
		<div class="mt-20">
			<p>Dwell detected!</p>
		</div>
	{/if}
</div>
