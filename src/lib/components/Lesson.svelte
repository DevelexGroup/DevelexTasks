<script lang="ts">
	import {
		createGazeInput,
		type GazeInput,
		type GazeInputConfigWithFixations
	} from '@473783/develex-core';
	import { inputCreationConfig, inputWindowFieldsConfig } from '$lib/stores/gazeConfig';
	import { error } from '@sveltejs/kit';
	import { onMount } from 'svelte';

	let gazeInput: GazeInput<GazeInputConfigWithFixations>;
	let isReady = false;
	onMount(() => {
		const gazeInput: GazeInput<GazeInputConfigWithFixations> =
			createGazeInput($inputCreationConfig);

		if (!$inputWindowFieldsConfig) error(600, 'Window fields not set');

		const { mouse, window } = $inputWindowFieldsConfig;
		gazeInput.setWindowCalibration(mouse, window);

		gazeInput
			.connect()
			.then(() => {
				isReady = true;
			})
			.catch((err) => {
				console.error(err);
			});
	});
</script>

{#if isReady}
	<slot {gazeInput} />
{:else}
	<p>Loading...</p>
{/if}
