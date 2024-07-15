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

	/**
	 * @type {GazeInput<GazeInputConfigWithFixations>}
	 * The gaze input object that will be used to interact with the gaze data.
	 * Currently always GazePoint and do not allow custom configuration yet.
	 */
	let gazeInput: GazeInput<GazeInputConfigWithFixations>;

	/**
	 * @type {GazeInteractionScreenFixation}
	 * This fixation event detector always return the screen coordinates of the fixation.
	 * No elements are returned, it serves as a base for the following detector.
	 */
	let gazeInteractionScreenFixation: GazeInteractionScreenFixation;

	/**
	 * @type {GazeInteractionObjectSetFixation}
	 * This fixation event detector always return an array of registered elements (aois) that were fixated on.
	 * They can overlap, so the array can contain multiple elements.
	 * When no element is fixated, the array is empty.
	 */
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
	<slot gazeFixationEmitter={gazeInteractionObjectSetFixation} />
{:else if state === 'error'}
	<LessonError {errorMessages} />
{/if}
