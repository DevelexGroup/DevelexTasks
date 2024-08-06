<script lang="ts">
	import type {
		GazeDataPointWithFixation,
		GazeInteractionObjectSetFixation
	} from '@473783/develex-core';
	import { derived, writable } from 'svelte/store';
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

	export let currentContent: { text: string; id: string }[][];
	export let gazeFixationEmitter: GazeInteractionObjectSetFixation;
	export let wordReader: IWordReader;
	export let speechEvaluator: ISpeechEvaluator;
	export let speechRecognition: ISpeechRecognition;

	/**
	 * --------------------------
	 * --------------------------
	 * Types to fix.
	 * TODO: core must export these types
	 * --------------------------
	 * --------------------------
	 */
	interface GazeInteractionEvent {
		type: string;
		sessionId: string;
		timestamp: number;
	}

	interface GazeInteractionObjectFixationEvent extends GazeInteractionEvent {
		fixationId: number;
		duration: number;
		gazeData: GazeDataPointWithFixation;
		target: unknown;
		settings: unknown;
	}

	interface GazeInteractionObjectSetFixationEvent extends GazeInteractionObjectFixationEvent {
		type: 'fixationSetProgress' | 'fixationSetEnd' | 'fixationSetStart';
		target: Element[];
		settings: GazeInteractionObjectSetFixationSettings[];
	}

	interface GazeInteractionFixationSettings {
		bufferSize: number;
	}

	interface GazeInteractionObjectSetFixationSettings extends GazeInteractionFixationSettings {
		fixationSetProgress: (event: GazeInteractionObjectSetFixationEvent) => void;
		fixationSetEnd: (event: GazeInteractionObjectSetFixationEvent) => void;
		fixationSetStart: (event: GazeInteractionObjectSetFixationEvent) => void;
	}

	/**
	 * --------------------------
	 * --------------------------
	 * End of the types  to fix.
	 * --------------------------
	 * --------------------------
	 */

	const FIXATION_WORD = 'fixation-word';
	const FIXATION_EYE = 'fixation-eye';
	const SENTENCE_PREFIX = 'Sentence';

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
		console.warn(event);
		if (isCorrect) {
			hasSaidPhrase.set(true);
		}
	};

	const stopSpeechEvaluation = () => {
		try {
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
	 * isFixating: Indicates if the user has fixated on the content.
	 * hasSaidPhrase: Indicates if the user has said the phrase.
	 */
	const isFixating = writable(false);
	const hasSaidPhrase = writable(false);
	let fixationsFromStartToSpeechEnd: GazeInteractionObjectSetFixationEvent[] = [];

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

		if (target.some((t) => t.id === FIXATION_EYE)) {
			validateFixation = false;
		}

		// if fixated on the first word of the current sentence, set isFixating to true
		if (target.some((t) => t.id === `${FIXATION_WORD}-${SENTENCE_PREFIX + $taskSentenceIndex}-0`)) {
			if (!validateFixation) {
				isFixating.set(true);
			}
		}

		fixationsFromStartToSpeechEnd.push(event);
	});

	const inOptions = { duration: 750, delay: 200 };
	const outOptions = { duration: 200 };

	const evaluateWhetherFixationsWithinTolerance = (
		fixations: GazeInteractionObjectSetFixationEvent[],
		sentenceId: string,
		tolerance: number
	): boolean => {
		// any fixations for which one of the targets contains in its id the sentenceId
		const fixationsInsideTheSentence = fixations.filter((fixation) =>
			fixation.target.some((t) => t.id.includes(sentenceId))
		);
		const numberOfFixationsOutsideTheSentence =
			fixations.length - fixationsInsideTheSentence.length;
		return numberOfFixationsOutsideTheSentence <= tolerance;
	};

	const evaluateSentence = async (sentence: { text: string; id: string }[]) => {
		wordReader.read(sentence);

		// First countdown: wait for fixation or timeout
		await waitForCondition(isFixating, 5000);
		console.log('User has fixated on the content.');

		fixationsFromStartToSpeechEnd = [];

		// Reset fixation store for the next phase
		isFixating.set(false);

		// Start speech evaluation - whether the user has said the phrase
		const sentencePhrase = sentence.map((word) => word.text).join(' ');
		startSpeechEvaluation(sentencePhrase);

		// Second countdown: wait for the phrase or timeout
		await waitForCondition(hasSaidPhrase, 7000);
		console.log('User has said the phrase.');

		// Reset phrase store for the next phase
		stopSpeechEvaluation();
		hasSaidPhrase.set(false);

		// Evaluate whether the user fixated maximum 2 times outside the sentence
		const isSuccesfulGazingPattern = evaluateWhetherFixationsWithinTolerance(
			fixationsFromStartToSpeechEnd,
			`${SENTENCE_PREFIX + $taskSentenceIndex}`,
			2
		);

		if (!isSuccesfulGazingPattern) throw new Error('User did not fixate on the content properly.');

		nextSentence(); // for highlighting the next sentence
	};

	const startProcess = async () => {
		try {
			for await (const sentence of currentContent) {
				await evaluateSentence(sentence);
			}
			dispatch('lessonSuccess');
		} catch (error) {
			console.warn('Lesson mistake', error);
			dispatch('lessonMistake');
		} finally {
			console.log('Lesson complete');
			stopSpeechEvaluation();
		}
	};

	$: if (!validateFixation) {
		startProcess();
	}
</script>

<div class="lesson-stack grid w-full max-w-7xl auto-cols-auto items-center justify-center">
	{#if validateFixation}
		<div
			in:fade={inOptions}
			out:fade={outOptions}
			class="flex w-24 max-w-7xl items-center justify-start"
		>
			<LessonCross {registerElement} {unregisterElement} id={FIXATION_EYE} />
		</div>
	{/if}
	<div
		class="col-start-2 flex w-auto max-w-7xl flex-wrap items-center justify-center gap-12 transition-all"
		class:opacity-0={validateFixation}
	>
		<div class="flex w-auto max-w-7xl flex-wrap gap-x-12">
			{#each currentContent as sentence, sentenceIndex}
				{#each sentence as word, wordIndex}
					<LessonWord
						id={`${FIXATION_WORD}-${SENTENCE_PREFIX + sentenceIndex}-${wordIndex}`}
						{registerElement}
						{unregisterElement}
						word={word.text}
						isHighlighted={sentenceIndex === $taskSentenceIndex}
					/>
				{/each}
			{/each}
		</div>
	</div>
</div>

<style>
	.lesson-stack {
		display: grid;
		grid-template-columns: 6rem /* w-24 in tailwind */ 1fr;
	}
</style>
