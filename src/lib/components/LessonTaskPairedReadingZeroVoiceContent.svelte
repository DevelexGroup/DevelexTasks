<script lang="ts">
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
	import LessonLayoutPairedReading from './LessonLayoutPairedReading.svelte';

	export let gazeFixationEmitter: GazeInteractionObjectSetFixation;
	export let currentContent: string;
	export let speechEvaluator: ISpeechEvaluator;
	export let speechRecognition: ISpeechRecognition;

	const FIXATION_EYE = 'fixation-eye';
	const FIXATION_WORD = 'fixation-word';

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
			bufferSize: 150
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
			dispatch('lessonSuccess');
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
		lessonFail: void;
	}>();

	const startSpeechEvaluation = (phraseToBeSaid: string) => {
		speechRecognition.start();
		speechEvaluator.targetWord = phraseToBeSaid;
		speechRecognition.on('speech', evaluateSpeech);
	};

	const evaluateSpeech = (event: ISpeechRecognitionResult) => {
		const evaluation = speechEvaluator.evaluateSpeech(event);
		console.warn(event, evaluation);
		if (evaluation.isCorrect) {
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

			dispatch('lessonComplete');
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

<LessonLayoutPairedReading {validateFixation}>
	<LessonCross {registerElement} {unregisterElement} id={FIXATION_EYE} slot="cross-fix" />
	<svelte:fragment slot="word-area">
		<LessonWord {registerElement} {unregisterElement} word={currentContent} id={FIXATION_WORD} />
	</svelte:fragment>
</LessonLayoutPairedReading>
