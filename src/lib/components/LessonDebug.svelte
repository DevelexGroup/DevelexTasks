<script lang="ts">
	import { GazeIndicator, type GazeDataPoint, type GazeManager } from 'develex-js-sdk';
	import { getContext, onDestroy, onMount } from 'svelte';

	let isGazeActive = false;
	let drawGazeIndicator: (data: GazeDataPoint) => void;

	const gazeManager = getContext<GazeManager>('gazeManager');

	function toggleGaze() {
		isGazeActive = !isGazeActive;
		if (isGazeActive) {
			const gazeIndicator: GazeIndicator = new GazeIndicator();
			if (!document) return;
			gazeIndicator.init(document);
			drawGazeIndicator = (data: GazeDataPoint) => {
				gazeIndicator.draw(data);
			};
			gazeManager.on('inputData', drawGazeIndicator);
		} else {
			gazeManager.off('inputData', drawGazeIndicator);
		}
	}

	onDestroy(() => {
		if (isGazeActive) {
			gazeManager.off('inputData', drawGazeIndicator);
		}
	});
</script>

<div class="fixed bottom-0 left-1/2 mb-4 flex -translate-x-1/2 items-center justify-center">
	<button
		class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-white hover:bg-gray-700"
		on:click={toggleGaze}
	>
		👁️
	</button>
</div>
