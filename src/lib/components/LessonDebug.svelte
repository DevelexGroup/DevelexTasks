<script lang="ts">
	import {
		GazeIndicator,
		type GazeDataPoint,
		type GazeInput,
		type GazeInputConfig
	} from '@473783/develex-core';
	import { onDestroy, onMount } from 'svelte';

	export let gazeInput: GazeInput<GazeInputConfig>;

	let drawGazeIndicator: (data: GazeDataPoint) => void;

	onMount(() => {
		const gazeIndicator: GazeIndicator = new GazeIndicator();
		if (!document) {
			return; // Do nothing if the document is not available. (e.g. during SSR)
		}
		gazeIndicator.init(document);
		drawGazeIndicator = (data: GazeDataPoint) => {
			gazeIndicator.draw(data);
		};
		gazeInput.on('data', drawGazeIndicator);
	});

	onDestroy(() => {
		gazeInput.off('data', drawGazeIndicator);
	});
</script>
