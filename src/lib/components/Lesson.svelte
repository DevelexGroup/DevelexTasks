<script lang="ts">
	import {
		createGazeInput,
		GazeInteractionObjectSetFixation,
		GazeInteractionScreenFixation,
		type GazeInput,
		type GazeInputConfigWithFixations
	} from '@473783/develex-core';
	import { inputCreationConfig, inputWindowFieldsConfig } from '$lib/stores/gazeConfig';
	import { onMount } from 'svelte';
	import LessonError from './LessonError.svelte';
	import LessonLoad from './LessonLoad.svelte';
	import { writable, type Writable } from 'svelte/store';

	const handleError = (event: Event) => {
		console.log(event);
		const error = event instanceof ErrorEvent ? event.error : event;
		const message = error instanceof Error ? error.message : error.toString();
		errorMessages = [...errorMessages, message];
		state = 'error';
	};

	let errorMessages: string[] = [];
	let state: 'load' | 'ready' | 'error' = 'load';

	let gazeInput: GazeInput<GazeInputConfigWithFixations>;
	let gazeInteractionScreenFixation: GazeInteractionScreenFixation;
	let gazeInteractionObjectSetFixation: GazeInteractionObjectSetFixation;

	const initGaze = async () => {
		const gazeInput: GazeInput<GazeInputConfigWithFixations> =
			createGazeInput($inputCreationConfig);

		if (!$inputWindowFieldsConfig)
			throw new Error(
				'Window fields config not found. You are probably trying to use a gaze-based lesson without going through sections.'
			);

		const { mouse, window } = $inputWindowFieldsConfig;
		gazeInput.setWindowCalibration(mouse, window);

		gazeInteractionScreenFixation = new GazeInteractionScreenFixation();
		gazeInteractionObjectSetFixation = new GazeInteractionObjectSetFixation();

		gazeInteractionScreenFixation.connect(gazeInput);
		gazeInteractionObjectSetFixation.connect(gazeInteractionScreenFixation);

		await gazeInput.connect();
		await gazeInput.start();

		state = 'ready';
	};

	onMount(initGaze);
</script>

<svelte:window
	on:error|capture={handleError}
	on:unhandledrejection|capture={(e) => handleError(e.reason)}
/>

{#if state === 'load'}
	<LessonLoad />
{:else if state === 'ready'}
	<slot {gazeInput} />
{:else if state === 'error'}
	<LessonError {errorMessages} />
{/if}
