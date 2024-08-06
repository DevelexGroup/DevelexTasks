<script lang="ts">
	import type { GazeInteractionObjectSetFixation } from '@473783/develex-core';
	import { derived, writable, get } from 'svelte/store';
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import LessonWord from './LessonWord.svelte';
	import LessonCross from './LessonCross.svelte';
	import type { IWordReader } from '$lib/interfaces/IWordReader';
	import type { ISpeechEvaluator } from '$lib/interfaces/ISpeechEvaluator';
	import type {
		ISpeechRecognition,
		ISpeechRecognitionResult
	} from '$lib/interfaces/ISpeechRecognition';
	import { waitForCondition } from '$lib/utils/waitForCondition';

	export let currentContent: string[];
	export let gazeFixationEmitter: GazeInteractionObjectSetFixation;
	export let wordReader: IWordReader;
	export let speechEvaluator: ISpeechEvaluator;
	export let speechRecognition: ISpeechRecognition;

	const FIXATION_WORD = 'fixation-word';
	const FIXATION_EYE = 'fixation-eye';

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

	const sentenceWordIndex = writable(0);
	const sentenceWordComplete = derived(
		sentenceWordIndex,
		($sentenceWordIndex) => $sentenceWordIndex >= currentContent.length - 1
	);

	const nextSentenceWord = (): boolean => {
		if (get(sentenceWordComplete)) {
			return true;
		}

		sentenceWordIndex.update((n) => n + 1);

		return false;
	};

	let validateFixation: boolean = true;

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
		console.log(target);

		if (!Array.isArray(target) || target.length <= 0) {
			return;
		}

		if (target.some((t) => t.id === FIXATION_EYE)) {
			validateFixation = false;
			return;
		}

		if (target.some((t) => t.id === `${FIXATION_WORD}-${$sentenceWordIndex}`)) {
			if (validateFixation) return;
			isFixating.set(true);
			nextSentenceWord();
		}
	});

	const inOptions = { duration: 750, delay: 200 };
	const outOptions = { duration: 200 };

	const startProcess = async () => {
		try {
			for (let index = 0; index < currentContent.length; index++) {
				const word = currentContent[index];
				wordReader.read([
					{
						text: word,
						id: index.toString()
					}
				]); // TODO: Rework this to content to be actually object with id and text

				// First countdown: wait for fixation or timeout
				await waitForCondition(isFixating, 5000);

				// Reset fixation store for the next phase
				isFixating.set(false);

				// Start speech evaluation - whether the user has said the phrase
				startSpeechEvaluation(word);

				// Second countdown: wait for the phrase or timeout
				await waitForCondition(hasSaidPhrase, 5000);

				// Reset phrase store for the next phase
				stopSpeechEvaluation();
				hasSaidPhrase.set(false);
			}
			dispatch('lessonSuccess');
			console.log('Lesson success');
		} catch (error) {
			console.warn('Lesson mistake');
			dispatch('lessonMistake');
		} finally {
			console.log('Lesson complete');
		}
	};

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
			class="flex w-screen max-w-7xl items-center justify-center space-x-0.5"
		>
			{#each currentContent as word, index}
				<!-- In comparison to L1, it does not use highligting. Otherwise, it is basically the same component -->
				<LessonWord id={`${FIXATION_WORD}-${index}`} {registerElement} {unregisterElement} {word} />
			{/each}
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
