<script lang="ts">
	import LessonCross from './LessonCross.svelte';
	import type { GazeInteractionObjectFixationEvent, GazeManager } from '@473783/develex-core';
	import { createEventDispatcher, getContext, onDestroy, onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { waitForCondition, waitForTimeout } from '$lib/utils/waitForCondition';
	import type { LessonTaskVisualDiffLevelProps } from './LessonTaskVisualDiffLevel.type';
	import LessonTaskVisualDiffLayout from './LessonTaskVisualDiffLayout.svelte';
	import LessonTaskVisualDiffGrid from './LessonTaskVisualDiffGrid.svelte';

	let {
		currentContent,
		wordReader,
		shouldReadCorrectSyllable = true,
		isSyllableAssignmentPresent = true,
		correctSyllableVisibilityTimeout = 0,
		markWantedSyllables = false,
		assignmentGap = 120,
		syllableGap = 12,
		gridCols = 0
	}: LessonTaskVisualDiffLevelProps = $props();

	const gazeManager = getContext<GazeManager>('gazeManager');

	/**
	 * State stores to keep up with the state of the lesson
	 * and control the flow of the lesson
	 */
	let wasCrossFixated: Writable<boolean> = writable(false);
	let wasCorrectSyllableSelected: Writable<boolean> = writable(false);
	let wasMistakenTooManyTimes: Writable<boolean> = writable(false);

	let mistakeCount: number = 0;
	let currentRowIndex: number = $state(0);

	// Hide every assignment syllable by default
	let hideAssignmentSyllables: number[] = $state(currentContent.map((_, index) => index));

	const FIXATION_EYE = 'fixation-eye';
	const CROSS_FIXATION_TIMEOUT = 8000;
	const SYLLABLE_SELECTION_TIMEOUT = 80000;
	const MAXIMUM_MISTAKE_COUNT = 3;

	const dispatch = createEventDispatcher<{
		lessonSuccess: void;
		lessonMistake: void;
		lessonComplete: void;
		lessonFail: void;
	}>();

	const registerElement = (element: HTMLElement) => {
		gazeManager.register({
			interaction: 'fixation',
			element,
			settings: {
				bufferSize: 150
			}
		});
	};

	const unregisterElement = (element: HTMLElement) => {
		gazeManager.unregister({
			interaction: 'fixation',
			element
		});
	};

	const handleCorrectSyllableClick = () => {
		wasCorrectSyllableSelected.set(true);
	};

	const handleIncorrectSyllableClick = () => {
		mistakeCount++;
		dispatch('lessonMistake');
		if (mistakeCount >= MAXIMUM_MISTAKE_COUNT) {
			wasMistakenTooManyTimes.set(true);
		}
	};

	/**
	 * Evaluate the gaze event to determine the user's gaze
	 * interaction with the task
	 * @param event
	 * @returns void
	 */
	const evaluateGazeEvent = (event: GazeInteractionObjectFixationEvent) => {
		const { target } = event;

		/**
		 * Currently only checking for crossfixation
		 */
		if (target.some((t) => t.id === FIXATION_EYE)) {
			wasCrossFixated.set(true);
		}

		if (
			target.some((t) => t.id === 'visdiff-choice_0_0') &&
			currentContent[currentRowIndex].syllables.length == 1
		) {
			handleCorrectSyllableClick();
		}
	};

	/**
	 * Step 2: Read the correct syllable to the user
	 * if the setting is enabled
	 * @returns void
	 */
	const processReadingAssignmentSyllable = async () => {
		if (!shouldReadCorrectSyllable) return;
		await waitForTimeout(500);

		const content = currentContent[currentRowIndex];

		let textToRead =
			content.correctSyllable == undefined ? content.incorrectSyllable! : content.correctSyllable!;

		if (content.wordToRead !== undefined) {
			textToRead = content.wordToRead;
		}

		void wordReader.read([
			{
				text: textToRead,
				id: 'correct-syllable'
			}
		]);
	};

	/**
	 * Step 2: Make syllable assignment invisible after a certain time
	 * if the setting is enabled (i.e. correctSyllableVisibilityTimeout > 0)
	 * @returns void
	 */
	const processHideAssignmentSyllable = () => {
		if (correctSyllableVisibilityTimeout <= 0) return;
		waitForTimeout(correctSyllableVisibilityTimeout).then(() => {
			hideAssignmentSyllables = [0];
		});
	};

	/**
	 * Step 1: Wait for the user to fixate on the crossfix
	 * @returns void
	 */
	const processCrossFixation = async () => {
		try {
			await waitForCondition(wasCrossFixated, CROSS_FIXATION_TIMEOUT);
			dispatch('lessonSuccess');
		} catch {
			dispatch('lessonFail');
		}
	};

	/**
	 * Step 3: Wait for the user to select the correct syllable
	 * @returns void
	 */
	const processSyllableSelection = async () => {
		try {
			await waitForCondition(
				wasCorrectSyllableSelected,
				SYLLABLE_SELECTION_TIMEOUT,
				wasMistakenTooManyTimes
			);
			dispatch('lessonSuccess');
			return true;
		} catch {
			dispatch('lessonFail');
			return false;
		}
	};

	const processStateCleanup = () => {
		wasCorrectSyllableSelected.set(false);
	};

	/**
	 * Main logic of the task, process steps in order
	 * to complete the task successfully
	 * @returns void
	 */
	const processTaskLogic = async () => {
		await processCrossFixation(); // Step 1: Wait for the user to fixate on the crossfix
		for await (const [index, _] of currentContent.entries()) {
			currentRowIndex = index;
			// hide every assignment syllable except the current one
			hideAssignmentSyllables = currentContent.map((_, i) => (i === index ? -1 : i));
			processReadingAssignmentSyllable(); // Step 2: Read the correct syllable to the user, no need to use await here (Simultaneous)
			processHideAssignmentSyllable(); // Step 2: Hide the correct syllable after a certain time (Simultaneous)
			const wasSuccess = await processSyllableSelection(); // Step 3: Wait for the user to select the correct syllable
			if (!wasSuccess) return;
			processStateCleanup();
			await waitForTimeout(500);
		}
		dispatch('lessonComplete');
	};

	/**
	 * Start the task logic and gaze event evaluation
	 * when the component is mounted
	 */
	onMount(() => {
		gazeManager.on('fixationObjectStart', evaluateGazeEvent);
		processTaskLogic();
	});

	/**
	 * Clean up the event listener when the component is destroyed
	 * to prevent memory leaks
	 */
	onDestroy(() => {
		gazeManager.off('fixationObjectStart', evaluateGazeEvent);
	});
</script>

{#snippet crossFixArea()}
	<LessonCross {registerElement} {unregisterElement} id={FIXATION_EYE} />
{/snippet}

{#snippet taskArea()}
	<LessonTaskVisualDiffGrid
		content={currentContent}
		{registerElement}
		{unregisterElement}
		{hideAssignmentSyllables}
		{isSyllableAssignmentPresent}
		{assignmentGap}
		{syllableGap}
		{currentRowIndex}
		{markWantedSyllables}
		{gridCols}
		on:correct-syllable-clicked={handleCorrectSyllableClick}
		on:incorrect-syllable-clicked={handleIncorrectSyllableClick}
	/>
{/snippet}

<LessonTaskVisualDiffLayout isCrossfixVisible={!$wasCrossFixated} {crossFixArea} {taskArea} />
