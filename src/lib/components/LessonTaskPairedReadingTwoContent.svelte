<script lang="ts">
	import type { GazeInteractionObjectSetFixation } from '@473783/develex-core';
	import { derived, writable, get } from 'svelte/store';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import LessonWord from './LessonWord.svelte';
	import LessonCross from './LessonCross.svelte';
	import type { IWordReader } from '$lib/interfaces/IWordReader';
	import type { ISpeechEvaluator } from '$lib/interfaces/ISpeechEvaluator';
	import type {
		ISpeechRecognition,
		ISpeechRecognitionResult
	} from '$lib/interfaces/ISpeechRecognition';
	import { waitForCondition } from '$lib/utils/waitForCondition';
	import LessonLayoutPairedReading from './LessonLayoutPairedReading.svelte';
	import { retry } from '$lib/utils/retry';

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
		lessonFail: void;
	}>();

	const evaluateSpeech = (event: ISpeechRecognitionResult) => {
		const evaluation = speechEvaluator.evaluateSpeech(event);
		console.warn(event, evaluation);
		if (evaluation.isCorrect) {
			hasSaidPhrase.set(true);
		}
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
			bufferSize: 150
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

	const startProcess = async () => {
		try {
			for await (const word of currentContent) {
				await retry(
					async () => {
						wordReader.read([
							{
								text: word,
								id: '0'
							}
						]);

						await waitForCondition(isFixating, 3000);
						dispatch('lessonSuccess');

						hasSaidPhrase.set(false);

						speechEvaluator.targetWord = word;

						await waitForCondition(hasSaidPhrase, 5000);
					},
					{
						retries: 3,
						delay: 5000,
						onRetry: () => {
							dispatch('lessonMistake');
						}
					}
				);
			}
			dispatch('lessonComplete');
			console.log('Lesson complete');
		} catch (error) {
			console.warn('Lesson mistake');
			dispatch('lessonFail');
		} finally {
			console.log('Lesson complete');
		}
	};

	$: if (!validateFixation) {
		dispatch('lessonSuccess');
		startProcess();
	}

	onMount(() => {
		speechRecognition.start();
		speechRecognition.on('speech', evaluateSpeech);
	});

	onDestroy(() => {
		speechRecognition.off('speech', evaluateSpeech);
	});
</script>

<LessonLayoutPairedReading {validateFixation}>
	<LessonCross {registerElement} {unregisterElement} id={FIXATION_EYE} slot="cross-fix" />
	<svelte:fragment slot="word-area">
		{#each currentContent as word, index}
			<!-- In comparison to L1, it does not use highligting. Otherwise, it is basically the same component -->
			<LessonWord id={`${FIXATION_WORD}-${index}`} {registerElement} {unregisterElement} {word} />
		{/each}
	</svelte:fragment>
</LessonLayoutPairedReading>
