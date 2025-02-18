<script lang="ts">
	import { createEventDispatcher, getContext, onDestroy, onMount } from 'svelte';
	import { derived, get, writable } from 'svelte/store';
	import {
		PairedReadingIdManager,
		PairedReadingManager
	} from './LessonTaskPairedReadingLevel.utility';
	import LessonTaskPairedReadingLayout from './LessonTaskPairedReadingLayout.svelte';
	import type { LessonTaskPairedReadingTaskProps } from './LessonTaskPairedReadingLevel.type';
	import type {
		GazeManager,
		GazeInteractionObjectDwellEvent,
		GazeInteractionObjectIntersectEvent
	} from '@473783/develex-core';
	import { getCancellableAsync, waitForConditionCancellable } from '$lib/utils/waitForCondition';
	import { retry } from '$lib/utils/retry';

	let {
		currentContent,
		speechEvaluator,
		speechRecognition,
		wordReader,
		shouldListenForVoice,
		bufferSize,
		logicType = 'main',
		shouldEmitMistake = true,
		shouldHighlight = true
	}: LessonTaskPairedReadingTaskProps = $props();

	const dispatch = createEventDispatcher<{
		lessonSuccess: void;
		lessonMistake: void;
		lessonComplete: void;
		lessonFail: void;
	}>();

	const gazeManager = getContext<GazeManager>('gazeManager');

	// State variables
	const hasFixatedStartCross = writable(false);
	const hasFixatedEndCross = writable(false);
	const currentlyReadingPhrase = writable<{ text: string; id: string } | null>(null);
	let forceSuccess = false;
	const abortController = new AbortController();

	const pairedReadingManager = new PairedReadingManager(currentContent);
	const wordsStore = writable(pairedReadingManager.getWords());
	const gridStateStore = writable<'crossStart' | 'reading' | 'crossEnd'>('crossStart');

	const wordStore = derived(wordsStore, ($wordsStore) => $wordsStore);

	function evaluateReaderWordChange(phrase: { text: string; id: string } | null) {
		currentlyReadingPhrase.set(phrase);
	}

	const MIN_GAZE_POINTS = 10;
	const MIN_SUCCESS_PERCENTAGE = 80;
	async function performSingleReadingSegment() {
		const segment = pairedReadingManager.getReadingSegment();
		gazeMistakePoints = 0;
		gazeCorrectPoints = 0;
		forceSuccess = false;
		try {
			await wordReader.read([segment]);
			const totalPoints = gazeCorrectPoints + gazeMistakePoints;
			const successPercentage = (gazeCorrectPoints / totalPoints) * 100;
			if (totalPoints < MIN_GAZE_POINTS && !forceSuccess) {
				throw new Error('Less than 10 gaze points');
			}
			if (successPercentage < MIN_SUCCESS_PERCENTAGE && !forceSuccess) {
				throw new Error('Less than 80% of the gaze points are correct');
			}
		} catch (error) {
			// If we manually forced success, consider it a success
			if (forceSuccess) {
				return; // Success case
			}
			throw error; // Re-throw for actual errors
		}
		currentlyReadingPhrase.set(null);
	}

	async function performReadingSegments() {
		for await (const segment of currentContent.evaluationSegment) {
			wordsStore.set(pairedReadingManager.getWords());
			void segment;
			await retry(() => getCancellableAsync(performSingleReadingSegment, abortController.signal), {
				retries: 999, // Virtually infinite retries
				delay: 5000,
				onRetry: () => {
					wordReader.abort();
					if (shouldEmitMistake) {
						dispatch('lessonMistake');
					}
				}
			});
			pairedReadingManager.nextSegment();
			dispatch('lessonSuccess');
		}
	}

	async function performWaitForStartCrossFixation() {
		try {
			await waitForConditionCancellable(hasFixatedStartCross, 100000, abortController.signal);
			return true;
		} catch {
			dispatch('lessonFail');
			return false;
		}
	}

	async function performWaitForEndCrossFixation() {
		await waitForConditionCancellable(hasFixatedEndCross, 100000, abortController.signal);
		dispatch('lessonComplete');
	}

	async function performTask() {
		const started = await performWaitForStartCrossFixation();
		if (!started) return;

		gridStateStore.set('reading');
		await performReadingSegments();

		gridStateStore.set('crossEnd');
		await performWaitForEndCrossFixation();
	}

	function setupRegisterElement(element: HTMLElement) {
		gazeManager.register({
			interaction: 'intersect',
			element,
			settings: {
				bufferSize
			}
		});
	}

	function setupUnregisterElement(element: HTMLElement) {
		gazeManager.unregister({
			interaction: 'intersect',
			element
		});
	}

	function setupCrossRegisterElement(element: HTMLElement) {
		gazeManager.register({
			interaction: 'dwell',
			element,
			settings: { bufferSize, dwellTime: 500 }
		});
	}

	function setupCrossUnregisterElement(element: HTMLElement) {
		gazeManager.unregister({
			interaction: 'dwell',
			element
		});
	}

	// Add keyboard event handler
	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			const currentState = get(gridStateStore);

			if (currentState === 'crossStart') {
				hasFixatedStartCross.set(true);
			} else if (currentState === 'reading') {
				// Force success for current reading segment
				forceSuccess = true;
				wordReader.abort();
			} else if (currentState === 'crossEnd') {
				hasFixatedEndCross.set(true);
			}
		} else if (event.key === 'Escape') {
			dispatch('lessonFail');
		}
	}

	function evaluateDwell(event: GazeInteractionObjectDwellEvent) {
		const { target } = event;
		if (target.some((t) => t.id === PairedReadingIdManager.getFixCrossAId())) {
			hasFixatedStartCross.set(true);
			return;
		}
		if (target.some((t) => t.id === PairedReadingIdManager.getFixCrossBId())) {
			hasFixatedEndCross.set(true);
			return;
		}
	}

	let gazeCorrectPoints = 0;
	let gazeMistakePoints = 0;
	function evaluateIntersect(event: GazeInteractionObjectIntersectEvent) {
		const { target } = event;
		const phrase = get(currentlyReadingPhrase);
		if (!phrase || get(gridStateStore) !== 'reading') return;
		const isGazePatternCorrect = target.some((target) =>
			PairedReadingIdManager.isWordInEvaluationSegmentByIndex(phrase.id, target.id, currentContent)
		);

		if (!isGazePatternCorrect) {
			gazeMistakePoints++;
		} else {
			gazeCorrectPoints++;
		}
	}

	onMount(() => {
		wordReader.onWordChange = evaluateReaderWordChange;
		performTask();
		gazeManager.on('intersect', evaluateIntersect);
		gazeManager.on('dwellFinish', evaluateDwell);
		// Change from keypress to keydown
		window.addEventListener('keydown', handleKeyPress);
	});

	onDestroy(() => {
		abortController.abort('Task destroyed');
		gazeManager.off('intersect', evaluateIntersect);
		gazeManager.off('dwellFinish', evaluateDwell);
		// Change from keypress to keydown
		window.removeEventListener('keydown', handleKeyPress);
	});
</script>

<LessonTaskPairedReadingLayout
	words={$wordStore}
	stage={$gridStateStore}
	crossRegisterFn={setupCrossRegisterElement}
	crossUnregisterFn={setupCrossUnregisterElement}
	wordsRegisterFn={setupRegisterElement}
	wordsUnregisterFn={setupUnregisterElement}
	{shouldHighlight}
/>

<!-- <LessonLayoutPairedReading {validateFixation}>
	<LessonCross {registerElement} {unregisterElement} id={FIXATION_EYE} slot="cross-fix" />
	<svelte:fragment slot="word-area">
		<LessonWord {registerElement} {unregisterElement} word={currentContent} id={FIXATION_WORD} />
	</svelte:fragment>
</LessonLayoutPairedReading> -->
