<script lang="ts">
	import { fade } from 'svelte/transition';
	import LessonCross from './LessonCross.svelte';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import type { GazeInteractionObjectSetFixation } from '@473783/develex-core';
	import LessonWord from './LessonWord.svelte';
	import type { ISpeechEvaluator } from '$lib/interfaces/ISpeechEvaluator';
	import type {
		ISpeechRecognition,
		ISpeechRecognitionResult
	} from '$lib/interfaces/ISpeechRecognition';
	import { writable } from 'svelte/store';
	import { waitForCondition } from '$lib/utils/waitForCondition';

	export let gazeFixationEmitter: GazeInteractionObjectSetFixation;
	export let currentContent: string;
	export let speechEvaluator: ISpeechEvaluator;
	export let speechRecognition: ISpeechRecognition;

	const FIXATION_EYE = 'fixation-eye';
	const FIXATION_WORD = 'fixation-word';
	const inOptions = { duration: 750, delay: 200 };
	const outOptions = { duration: 200 };

	let validateFixation = true;

	/**
	 * States of the task.
	 * isFixating: Indicates if the user has fixated on the content.
	 * hasSaidPhrase: Indicates if the user has said the phrase.
	 */
	const isFixating = writable(false);
	const hasSaidPhrase = writable(false);

	const registerElement = (element: HTMLElement) => {
		gazeFixationEmitter.register(element, {
			bufferSize: 25
		});
	};

	const unregisterElement = (element: HTMLElement) => {
		gazeFixationEmitter.unregister(element);
	};

	gazeFixationEmitter.on('fixationSetStart', (event) => {
		const { target } = event;

		if (!Array.isArray(target) || target.length <= 0) {
			/**
			 * Do nothing if the target is empty.
			 */
			return;
		}

		if (target.some((t) => t.id === FIXATION_EYE)) {
			/**
			 * If the target has an eye fixation, set the validateFixation to false.
			 * Resulting to the actual round can begin and the user can start reading the now visible content.
			 */
			validateFixation = false;
			return;
		}

		if (target.some((t) => t.id === FIXATION_WORD)) {
			/**
			 * If the target has a word fixation, start countdown during which the user must read out loud the content.
			 */
			if (validateFixation) return;
			isFixating.set(true);
		}
	});

	const dispatch = createEventDispatcher<{
		lessonSuccess: void;
		lessonMistake: void;
		lessonComplete: void;
	}>();

	const startSpeechEvaluation = (phraseToBeSaid: string) => {
		speechRecognition.start();
		speechEvaluator.targetWord = phraseToBeSaid;
		speechRecognition.on('speech', evaluateSpeech);
	};

	const evaluateSpeech = (event: ISpeechRecognitionResult) => {
		const { isCorrect } = speechEvaluator.evaluateSpeech(event);
		if (isCorrect) {
			hasSaidPhrase.set(true);
		}
	};

	const stopSpeechEvaluation = () => {
		speechRecognition.stop();
		speechRecognition.off('speech', evaluateSpeech);
	};

	const startProcess = async () => {
		try {
			// First countdown: wait for fixation or timeout
			await waitForCondition(isFixating, 5000);
			// Reset fixation store for the next phase
			isFixating.set(false);

			startSpeechEvaluation(currentContent);

			// Second countdown: wait for the phrase or timeout
			await waitForCondition(hasSaidPhrase, 5000);

			dispatch('lessonSuccess');
		} catch (error) {
			console.error(error);
			dispatch('lessonMistake');
		} finally {
			stopSpeechEvaluation();
		}
	};

	// Watcher for validateFixation changes
	$: if (!validateFixation) {
		startProcess();
	}
</script>

<div class="lesson-stack flex w-full max-w-7xl items-center justify-center">
	{#if validateFixation}
		<div
			in:fade={inOptions}
			out:fade={outOptions}
			class="flex w-screen max-w-7xl items-center justify-start"
		>
			<LessonCross {registerElement} {unregisterElement} id={FIXATION_EYE} />
		</div>
	{:else}
		<div
			in:fade={inOptions}
			out:fade={outOptions}
			class="flex w-screen max-w-7xl items-center justify-center"
		>
			<LessonWord {registerElement} {unregisterElement} word={currentContent} id={FIXATION_WORD} />
		</div>
	{/if}
</div>

<style>
	.lesson-stack {
		display: grid;
	}

	.lesson-stack > * {
		grid-area: 1 / 1;
	}
</style>
