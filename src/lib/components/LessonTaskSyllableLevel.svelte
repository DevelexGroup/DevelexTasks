<script lang="ts">
	import LessonTaskSyllableLayout from './LessonTaskSyllableLayout.svelte';
	import LessonCross from './LessonCross.svelte';
	import LessonTaskSyllableGrid from './LessonTaskSyllableGrid.svelte';
	import { createEventDispatcher, getContext, onDestroy, onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { waitForCondition, waitForTimeout } from '$lib/utils/waitForCondition';
	import type { LessonTaskSyllableLevelProps } from './LessonTaskSyllableLevel.type';
	import type {
		GazeInteractionObjectDwellEvent,
		GazeInteractionObjectFixationEvent,
		GazeManager
	} from '@473783/develex-core';

	let {
		currentContent,
		wordReader,
		shouldReadCorrectSyllable = true,
		isSyllableAssignmentPresent = true,
		correctSyllableVisibilityTimeout = 0,
		assignmentGap = 120,
		syllableGap = 12,
		highlightLine = false
	}: LessonTaskSyllableLevelProps = $props();

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
		lessonFrameTransition: string;
	}>();

	const registerElement = (element: HTMLElement) => {
		gazeManager.register({
			interaction: 'fixation',
			element,
			settings: {
				bufferSize: 150
			}
		});
		gazeManager.register({
			interaction: 'intersect',
			element,
			settings: {
				bufferSize: 150
			}
		});

		if (element.id == FIXATION_EYE) {
			gazeManager.register({
				interaction: 'dwell',
				element,
				settings: {
					dwellTime: 700,
					bufferSize: 50
				}
			});
		}
	};

	const unregisterElement = (element: HTMLElement) => {
		gazeManager.unregister({
			interaction: 'fixation',
			element
		});
		gazeManager.unregister({
			interaction: 'intersect',
			element
		});

		if (element.id == FIXATION_EYE) {
			gazeManager.unregister({
				interaction: 'dwell',
				element
			});
		}
	};

	const handleAllCorrectSyllablesClicked = () => {
		wasCorrectSyllableSelected.set(true);
	};

	const handleCorrectSyllableClick = () => {
		dispatch('lessonSuccess');
	};

	const handleIncorrectSyllableClick = () => {
		mistakeCount++;
		dispatch('lessonMistake');
		if (mistakeCount >= MAXIMUM_MISTAKE_COUNT) {
			wasMistakenTooManyTimes.set(true);
		} else {
			// TODO: tohle pak přes nějaký event, onLessonMistakeComplete
			setTimeout(() => {
				wordReader.read([
					{
						text: currentContent[currentRowIndex].correctSyllable,
						id: 'correct-syllable'
					}
				]);
			}, 4500);
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
	};

	const evaluateDwellEvent = (event: GazeInteractionObjectDwellEvent) => {
		const { target } = event;

		if (target.some((t) => t.id === FIXATION_EYE)) {
			wasCrossFixated.set(true);
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
		void wordReader.read([
			{
				text: currentContent[currentRowIndex].correctSyllable,
				id: 'correct-syllable'
			}
		]);
	};

	const handleReadAssignemt = () => {
		void wordReader.read([
			{
				text: currentContent[currentRowIndex].correctSyllable,
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
		dispatch('lessonFrameTransition', 'crossfixation');
		await processCrossFixation(); // Step 1: Wait for the user to fixate on the crossfix
		for await (const [index, _] of currentContent.entries()) {
			dispatch('lessonFrameTransition', `assignment-${index + 1}-of-${currentContent.length}`);
			currentRowIndex = index;
			// hide every assignment syllable except the current one
			hideAssignmentSyllables = currentContent.map((_, i) => (i === index ? -1 : i));
			processReadingAssignmentSyllable(); // Step 2: Read the correct syllable to the user, no need to use await here (Simultaneous)
			processHideAssignmentSyllable(); // Step 2: Hide the correct syllable after a certain time (Simultaneous)
			const wasSuccess = await processSyllableSelection(); // Step 3: Wait for the user to select the correct syllable
			if (!wasSuccess) return;
			processStateCleanup();
			dispatch('lessonFrameTransition', `assignmentDone-${index + 1}-of-${currentContent.length}`);
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
		gazeManager.on('dwellFinish', evaluateDwellEvent);
		processTaskLogic();
	});

	/**
	 * Clean up the event listener when the component is destroyed
	 * to prevent memory leaks
	 */
	onDestroy(() => {
		gazeManager.off('fixationObjectStart', evaluateGazeEvent);
		gazeManager.off('dwellFinish', evaluateDwellEvent);
	});
</script>

{#snippet crossFixArea()}
	<LessonCross {registerElement} {unregisterElement} id={FIXATION_EYE} />
{/snippet}

{#snippet taskArea()}
	<LessonTaskSyllableGrid
		content={currentContent}
		{registerElement}
		{unregisterElement}
		{hideAssignmentSyllables}
		{isSyllableAssignmentPresent}
		{assignmentGap}
		{syllableGap}
		{currentRowIndex}
		{highlightLine}
		on:all-correct-syllables-clicked={handleAllCorrectSyllablesClicked}
		on:correct-syllable-clicked={handleCorrectSyllableClick}
		on:incorrect-syllable-clicked={handleIncorrectSyllableClick}
		on:read-assigment={handleReadAssignemt}
	/>
{/snippet}

<LessonTaskSyllableLayout isCrossfixVisible={!$wasCrossFixated} {crossFixArea} {taskArea} />
