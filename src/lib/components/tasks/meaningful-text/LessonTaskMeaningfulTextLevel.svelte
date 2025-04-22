<script lang="ts">
	import LessonCross from '$lib/components/LessonCross.svelte';
	import type { GazeInteractionObjectDwellEvent, GazeManager } from '@473783/develex-core';
	import { createEventDispatcher, getContext, onDestroy, onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import {
		waitForCondition,
		waitForConditionNoTimeout,
		waitForTimeout
	} from '$lib/utils/waitForCondition';
	import type { LessonTaskMeaningfulTextLevelProps } from './LessonTaskMeaningfulTextLevel.type';
	import LessonTaskMeaningfulTextLayout from './LessonTaskMeaningfulTextLayout.svelte';
	import LessonTaskMeaningfulTextGrid from './LessonTaskMeaningfulTextGrid.svelte';

	let { currentContent, width = 600 }: LessonTaskMeaningfulTextLevelProps = $props();

	const gazeManager = getContext<GazeManager>('gazeManager');

	/**
	 * State stores to keep up with the state of the lesson
	 * and control the flow of the lesson
	 */
	let wasCrossFixated: Writable<boolean> = writable(false);
	let wasCorrectSyllableSelected: Writable<boolean> = writable(false);

	// Hide every assignment syllable by default

	const FIXATION_EYE = 'fixation-eye';
	const CROSS_FIXATION_TIMEOUT = 8000;

	const dispatch = createEventDispatcher<{
		lessonSuccess: void;
		lessonMistake: void;
		lessonComplete: {
			playRoundComplete: boolean;
		};
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

	const handleCorrectSyllableClick = () => {
		wasCorrectSyllableSelected.set(true);
	};

	const evaluateDwellEvent = (event: GazeInteractionObjectDwellEvent) => {
		const { target } = event;

		if (target.some((t) => t.id === FIXATION_EYE)) {
			wasCrossFixated.set(true);
		}
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
			await waitForConditionNoTimeout(wasCorrectSyllableSelected);
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
		dispatch('lessonFrameTransition', 'crossfixation');
		await processCrossFixation(); // Step 1: Wait for the user to fixate on the crossfix
		dispatch('lessonFrameTransition', `assignment-1-of-1`);
		const wasSuccess = await processSyllableSelection(); // Step 3: Wait for the user to select the correct syllable
		if (!wasSuccess) return;
		processStateCleanup();
		dispatch('lessonFrameTransition', `assignmentDone-1-of-1`);
		await waitForTimeout(500);
		dispatch('lessonComplete', {
			playRoundComplete: true
		});
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.keyCode == 32) {
			handleCorrectSyllableClick();
		}

		if (event.keyCode == 69) {
			console.log('picus');
			wasCrossFixated.set(true);
		}
	};

	/**
	 * Start the task logic and gaze event evaluation
	 * when the component is mounted
	 */
	onMount(() => {
		gazeManager.on('dwellFinish', evaluateDwellEvent);
		processTaskLogic();
	});

	/**
	 * Clean up the event listener when the component is destroyed
	 * to prevent memory leaks
	 */
	onDestroy(() => {
		gazeManager.off('dwellFinish', evaluateDwellEvent);
	});
</script>

{#snippet crossFixArea()}
	<LessonCross {registerElement} {unregisterElement} id={FIXATION_EYE} />
{/snippet}

{#snippet taskArea()}
	<LessonTaskMeaningfulTextGrid
		content={currentContent}
		{registerElement}
		{unregisterElement}
		{width}
	/>
{/snippet}

<LessonTaskMeaningfulTextLayout isCrossfixVisible={!$wasCrossFixated} {crossFixArea} {taskArea} />

<div class="absolute -z-10 mx-auto h-full w-full bg-[#e7e6e6]"></div>

<svelte:window on:keydown={handleKeyDown} />
