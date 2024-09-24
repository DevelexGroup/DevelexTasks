<script lang="ts">
	import type {
		GazeInteractionObjectSetFixation,
		GazeInteractionObjectSetFixationEvent
	} from '@473783/develex-core';
	import { writable } from 'svelte/store';
	import { createEventDispatcher, onDestroy } from 'svelte';
	import LessonWord from './LessonWord.svelte';
	import LessonCross from './LessonCross.svelte';
	import type { IWordReader } from '$lib/interfaces/IWordReader';
	import type { ISpeechEvaluator } from '$lib/interfaces/ISpeechEvaluator';
	import type {
		ISpeechRecognition,
		ISpeechRecognitionResult
	} from '$lib/interfaces/ISpeechRecognition';
	import { waitForCondition, waitForTimeout } from '$lib/utils/waitForCondition';
	import { retry } from '$lib/utils/retry';
	import LessonLayoutPairedReading from './LessonLayoutPairedReading.svelte';
	import type { LessonWordType } from '$lib/types/lesson';

	export let currentContent: LessonWordType[][];
	export let gazeFixationEmitter: GazeInteractionObjectSetFixation;
	export let wordReader: IWordReader;
	export let speechEvaluator: ISpeechEvaluator;
	export let speechRecognition: ISpeechRecognition;

	/**
	 * Should highlight the words when reading?
	 */
	export let shouldHighlightWords: boolean;

	let isHiglightTime = false;

	// check whether the speech recognition is on

	const FIXATION_WORD = 'fixation-word';
	const FIXATION_EYE = 'fixation-eye';
	const SENTENCE_PREFIX = 'Sentence';

	const dispatch = createEventDispatcher<{
		lessonSuccess: void;
		lessonMistake: void;
		lessonComplete: void;
		lessonFail: void;
	}>();

	const startSpeechEvaluation = (phraseToBeSaid: string) => {
		if (!speechRecognition.isOn) {
			speechRecognition.start();
		}
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
		try {
			wordReader.abort();
			speechRecognition.stop();
			speechRecognition.off('speech', evaluateSpeech);
		} catch (error) {
			console.warn('Error stopping speech recognition', error);
		}
	};

	const taskSentenceIndex = writable(0);

	const nextSentence = (): void => {
		taskSentenceIndex.update((n) => n + 1);
	};

	let validateFixation: boolean = true;

	/**
	 * States of the task.
	 * hasSaidPhrase: Indicates if the user has said the phrase.
	 */
	const hasSaidPhrase = writable(false);
	let fixationsFromStartToSpeechEnd: GazeInteractionObjectSetFixationEvent[] = [];

	const registerElement = (element: HTMLElement) => {
		gazeFixationEmitter.register(element, {
			bufferSize: 150
		});
	};

	const unregisterElement = (element: HTMLElement) => {
		gazeFixationEmitter.unregister(element);
	};

	gazeFixationEmitter.on('fixationObjectStart', (event) => {
		const { target } = event;

		if (target.some((t) => t.id === FIXATION_EYE)) {
			validateFixation = false;
		}

		fixationsFromStartToSpeechEnd.push(event);
	});

	const evaluateWhetherFixationsWithinTolerance = (
		fixations: GazeInteractionObjectSetFixationEvent[],
		sentenceId: string,
		tolerance: number
	): boolean => {
		// any fixations for which one of the targets contains in its id the sentenceId
		const fixationsInsideTheSentence = fixations.filter((fixation) =>
			fixation.target.some((t) => t.id.includes(sentenceId))
		);
		console.log('Fixations inside the sentence', fixationsInsideTheSentence);
		console.log('Fixations.', fixations);
		const numberOfFixationsOutsideTheSentence =
			fixations.length - fixationsInsideTheSentence.length;
		return numberOfFixationsOutsideTheSentence <= tolerance;
	};

	const evaluateSentence = async (sentence: { text: string; id: string }[]) => {
		try {
			wordReader.abort();
		} catch (error) {
			console.warn('Error aborting word reader', error);
		}
		wordReader.read(sentence);

		// Starting the speech evaluation, resetting the states
		hasSaidPhrase.set(false);
		fixationsFromStartToSpeechEnd = [];

		// Start speech evaluation - whether the user has said the phrase
		const sentencePhrase = sentence.map((word) => word.text).join(' ');
		startSpeechEvaluation(sentencePhrase);

		await waitForTimeout(1000); // Wait for the content to be read

		// Second countdown: wait for the phrase or timeout
		await waitForCondition(hasSaidPhrase, 7000);
		console.log('User has said the phrase.');

		// Evaluate whether the user fixated maximum 2 times outside the sentence
		const isSuccesfulGazingPattern = evaluateWhetherFixationsWithinTolerance(
			fixationsFromStartToSpeechEnd,
			`${SENTENCE_PREFIX + $taskSentenceIndex}`,
			4
		);

		if (!isSuccesfulGazingPattern) throw new Error('User did not fixate on the content properly.');

		nextSentence(); // for highlighting the next sentence
	};

	const startProcess = async () => {
		isHiglightTime = shouldHighlightWords;
		try {
			for await (const sentence of currentContent) {
				await retry(() => evaluateSentence(sentence), {
					retries: 3,
					delay: 5000,
					onRetry: () => dispatch('lessonMistake')
				}); // child can retry 3 times without failing the lesson
				dispatch('lessonSuccess');
				await waitForTimeout(100); // Wait for the content to be read
			}
			dispatch('lessonComplete');
		} catch (error) {
			console.warn('Lesson mistake', error);
			dispatch('lessonFail');
		} finally {
			console.log('Lesson complete');
		}
	};

	$: if (!validateFixation) {
		dispatch('lessonSuccess');
		setTimeout(() => {
			startProcess();
		}, 500);
	}

	onDestroy(() => {
		stopSpeechEvaluation();
	});
</script>

<LessonLayoutPairedReading {validateFixation}>
	<LessonCross {registerElement} {unregisterElement} id={FIXATION_EYE} slot="cross-fix" />
	<svelte:fragment slot="word-area">
		{#each currentContent as sentence, sentenceIndex}
			{#each sentence as word, wordIndex}
				<LessonWord
					id={`${FIXATION_WORD}-${SENTENCE_PREFIX + sentenceIndex}-${wordIndex}`}
					{registerElement}
					{unregisterElement}
					word={word.text}
					isHighlighted={sentenceIndex === $taskSentenceIndex && isHiglightTime}
				/>
			{/each}
		{/each}
	</svelte:fragment>
</LessonLayoutPairedReading>
