<script lang="ts">
	import { createEventDispatcher, getContext, onDestroy, onMount } from 'svelte';
	import { derived, get, writable } from 'svelte/store';
	import {
		PairedReadingIdManager,
		PairedReadingManager
	} from './LessonTaskPairedReadingLevel.utility';
	import LessonTaskPairedReadingLayout from './LessonTaskPairedReadingLayout.svelte';
	import type { LessonTaskPairedReadingTaskProps } from './LessonTaskPairedReadingLevel.type';
	import type { GazeManager, GazeInteractionObjectFixationEvent } from '@473783/develex-core';
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
		shouldEmitMistake = true
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
	let gazeMistakesDuringReading: number = 0;
	const abortController = new AbortController();

	const pairedReadingManager = new PairedReadingManager(currentContent);
	const wordsStore = writable(pairedReadingManager.getWords());
	const gridStateStore = writable<'crossStart' | 'reading' | 'crossEnd'>('crossStart');

	const wordStore = derived(wordsStore, ($wordsStore) => $wordsStore);

	function evaluateFixations(event: GazeInteractionObjectFixationEvent) {
		const { target } = event;

		if (
			target.some((t) => t.id === PairedReadingIdManager.getFixCrossAId()) &&
			get(gridStateStore) === 'crossStart'
		) {
			hasFixatedStartCross.set(true);
			return;
		}

		if (
			target.some((t) => t.id === PairedReadingIdManager.getFixCrossBId()) &&
			get(gridStateStore) === 'crossEnd'
		) {
			hasFixatedEndCross.set(true);
			return;
		}

		const phrase = get(currentlyReadingPhrase);
		if (!phrase || get(gridStateStore) !== 'reading') return;
		const isGazePatternCorrect = target.some((target) =>
			PairedReadingIdManager.isWordInEvaluationSegmentByIndex(phrase.id, target.id, currentContent)
		);

		if (!isGazePatternCorrect) {
			gazeMistakesDuringReading++;
		}
	}

	function evaluateReaderWordChange(phrase: { text: string; id: string } | null) {
		currentlyReadingPhrase.set(phrase);
	}

	async function performSingleReadingSegment() {
		const segment = pairedReadingManager.getReadingSegment();
		gazeMistakesDuringReading = 0;
		await wordReader.read([segment]);
		if (gazeMistakesDuringReading > 1) throw new Error('Too many mistakes');
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
			interaction: 'fixation',
			element,
			settings: {
				bufferSize
			}
		});
	}

	function setupUnregisterElement(element: HTMLElement) {
		gazeManager.unregister({
			interaction: 'fixation',
			element
		});
	}

	onMount(() => {
		wordReader.onWordChange = evaluateReaderWordChange;
		performTask();
		gazeManager.on('fixationObjectStart', evaluateFixations);
	});

	onDestroy(() => {
		abortController.abort('Task destroyed');
		gazeManager.off('fixationObjectStart', evaluateFixations);
	});
</script>

<LessonTaskPairedReadingLayout
	words={$wordStore}
	stage={$gridStateStore}
	crossRegisterFn={setupRegisterElement}
	crossUnregisterFn={setupUnregisterElement}
	wordsRegisterFn={setupRegisterElement}
	wordsUnregisterFn={setupUnregisterElement}
/>

<!-- <LessonLayoutPairedReading {validateFixation}>
	<LessonCross {registerElement} {unregisterElement} id={FIXATION_EYE} slot="cross-fix" />
	<svelte:fragment slot="word-area">
		<LessonWord {registerElement} {unregisterElement} word={currentContent} id={FIXATION_WORD} />
	</svelte:fragment>
</LessonLayoutPairedReading> -->
