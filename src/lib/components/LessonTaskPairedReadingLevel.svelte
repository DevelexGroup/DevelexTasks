<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import type { GazeInteractionObjectSetFixation } from '@473783/develex-core';
	import type { ISpeechEvaluator } from '$lib/interfaces/ISpeechEvaluator';
	import type { ISpeechRecognition } from '$lib/interfaces/ISpeechRecognition';
	import { derived } from 'svelte/store';
	import type { PairedReadingTaskType } from '$lib/types/lesson';
	import { getLogic } from './LessonTaskPairedReadingLevel.logic';

	export let gazeFixationEmitter: GazeInteractionObjectSetFixation;
	export let currentContent: PairedReadingTaskType;
	export let speechEvaluator: ISpeechEvaluator;
	export let speechRecognition: ISpeechRecognition;
	export let shouldListenForVoice: boolean;
	export let bufferSize: number;

	// const registerElement = (element: HTMLElement) => {
	// 	gazeFixationEmitter.register(element, {
	// 		bufferSize
	// 	});
	// };

	// const unregisterElement = (element: HTMLElement) => {
	// 	gazeFixationEmitter.unregister(element);
	// };

	// const onFixationSetStart = (event: GazeInteractionObjectSetFixationEvent) => {
	// 	const { target } = event;

	// 	if (!Array.isArray(target) || target.length <= 0) {
	// 		/**
	// 		 * Do nothing if the target is empty.
	// 		 */
	// 		return;
	// 	}

	// 	if (target.some((t) => t.id === PairedReadingIdManager.getFixCrossAId())) {
	// 		/**
	// 		 * If the target has a start cross, set the hasFixatedStartCross to true.
	// 		 */
	// 		hasFixatedStartCross.set(true);
	// 		return;
	// 	}

	// 	if (
	// 		target.some(
	// 			(t) =>
	// 				PairedReadingIdManager.parseWordId(t.id)?.evaluationSegmentIndex ===
	// 				$currentEvaluationSegment
	// 		)
	// 	) {
	// 		/**
	// 		 * If the target has a word, and the word is in the current evaluation segment,
	// 		 * set the isFixating to true.
	// 		 * TODO: Better gaze contigency handling
	// 		 */
	// 		isFixating.set(true);
	// 	}
	// };

	const dispatch = createEventDispatcher<{
		lessonSuccess: void;
		lessonMistake: void;
		lessonComplete: void;
		lessonFail: void;
	}>();

	// const evaluateSpeech = (event: ISpeechRecognitionResult) => {
	// 	const evaluation = speechEvaluator.evaluateSpeech(event);
	// 	if (evaluation.isCorrect) {
	// 		hasSaidPhrase.set(true);
	// 	}
	// };

	// const stopSpeechEvaluation = () => {
	// 	speechRecognition.stop();
	// 	speechRecognition.off('speech', evaluateSpeech);
	// };

	// const startProcess = async () => {
	// 	try {
	// 		// Notify the parent component that the user has successfully fixated the cross.
	// 		dispatch('lessonSuccess');
	// 		// First countdown: wait for fixation or timeout
	// 		await waitForCondition(isFixating, 5000);
	// 		// Reset fixation store for the next phase
	// 		isFixating.set(false);

	// 		// startSpeechEvaluation(currentContent);

	// 		// Second countdown: wait for the phrase or timeout
	// 		// await waitForCondition(hasSaidPhrase, 5000);

	// 		if (shouldListenForVoice) {
	// 			console.log('startProcess - shouldListenForVoice', currentContent);
	// 			speechEvaluator.targetWord = currentContent;
	// 			await waitForCondition(hasSaidPhrase, 5000);
	// 		}

	// 		dispatch('lessonSuccess');
	// 		await waitForTimeout(500);

	// 		dispatch('lessonComplete');
	// 	} catch (error) {
	// 		console.error(error);
	// 		dispatch('lessonMistake');
	// 	} finally {
	// 		stopSpeechEvaluation();
	// 	}
	// };

	const logic = getLogic(
		{
			gazeFixationEmitter,
			currentContent,
			speechEvaluator,
			speechRecognition,
			shouldListenForVoice,
			bufferSize
		},
		dispatch
	);

	const wordStore = derived(logic.wordsStore, ($wordsStore) => {
		return $wordsStore;
	});

	onMount(() => {
		logic.onMount();
	});

	onDestroy(() => {
		logic.onDestroy();
	});
</script>

<!-- <LessonLayoutPairedReading {validateFixation}>
	<LessonCross {registerElement} {unregisterElement} id={FIXATION_EYE} slot="cross-fix" />
	<svelte:fragment slot="word-area">
		<LessonWord {registerElement} {unregisterElement} word={currentContent} id={FIXATION_WORD} />
	</svelte:fragment>
</LessonLayoutPairedReading> -->
