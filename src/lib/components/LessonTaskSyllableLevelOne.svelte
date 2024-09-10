<script lang="ts">
	import LessonTaskSyllableLayout from './LessonTaskSyllableLayout.svelte';
	import LessonCross from './LessonCross.svelte';
	import type { SyllableTaskType } from '$lib/types/lesson';
	import type { GazeInteractionObjectSetFixation } from '@473783/develex-core';
	import type { IWordReader } from '$lib/interfaces/IWordReader';
	import LessonTaskSyllableGrid from './LessonTaskSyllableGrid.svelte';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { waitForCondition } from '$lib/utils/waitForCondition';
	import { retry } from '$lib/utils/retry';

	export let currentContent: SyllableTaskType;
	export let gazeFixationEmitter: GazeInteractionObjectSetFixation;
	export let wordReader: IWordReader;

	export let shouldReadCorrectSyllable: boolean = true;

	/**
	 * State stores to keep up with the state of the lesson
	 * and control the flow of the lesson
	 */
	let wasCrossFixated: Writable<boolean> = writable(false);
	let wasCorrectSyllableSelected: Writable<boolean> = writable(false);

	let hideAssignmentSyllables: number[] = [];

	const FIXATION_EYE = 'fixation-eye';
	const CROSS_FIXATION_TIMEOUT = 5000;
	const SYLLABLE_SELECTION_TIMEOUT = 4000;
	const MISTAKE_SCREEN_TIMEOUT = 5000;

	const dispatch = createEventDispatcher<{
		lessonSuccess: void;
		lessonMistake: void;
		lessonComplete: void;
		lessonFail: void;
	}>();

	const registerElement = (element: HTMLElement) => {
		gazeFixationEmitter.register(element, {
			bufferSize: 150
		});
	};

	const unregisterElement = (element: HTMLElement) => {
		gazeFixationEmitter.unregister(element);
	};

	const handleCorrectSyllableClick = () => {
		wasCorrectSyllableSelected.set(true);
	};

	const handleIncorrectSyllableClick = () => {
		dispatch('lessonMistake');
	};

	const evaluateGazeEvent = (event: GazeInteractionObjectSetFixationEvent) => {
		const { target } = event;

		/**
		 * First stage of the lesson, the user should fixate on the crossfix
		 */
		if (target.some((t) => t.id === FIXATION_EYE)) {
			wasCrossFixated.set(true);
		}
	};

	const processReadingAssignmentSyllable = () => {
		if (!shouldReadCorrectSyllable) return;
		void wordReader.read([
			{
				text: currentContent.correctSyllable,
				id: 'correct-syllable'
			}
		]);
	};

	const processCrossFixation = async () => {
		try {
			await waitForCondition(wasCrossFixated, CROSS_FIXATION_TIMEOUT);
			dispatch('lessonSuccess');
		} catch {
			dispatch('lessonFail');
		}
	};

	const processSyllableSelection = async () => {
		try {
			await retry(() => waitForCondition(wasCorrectSyllableSelected, SYLLABLE_SELECTION_TIMEOUT), {
				retries: 3,
				delay: MISTAKE_SCREEN_TIMEOUT,
				onRetry: () => dispatch('lessonMistake')
			});
			dispatch('lessonComplete');
		} catch {
			dispatch('lessonFail');
		}
	};

	/**
	 * Main logic of the task, process steps in order
	 */
	const processTaskLogic = async () => {
		processReadingAssignmentSyllable(); // Step 0: Read the correct syllable to the user, no need to use await here
		await processCrossFixation(); // Step 1: Wait for the user to fixate on the crossfix
		await processSyllableSelection(); // Step 2: Wait for the user to select the correct syllable
	};

	onMount(() => {
		gazeFixationEmitter.on('fixationSetStart', evaluateGazeEvent);
		processTaskLogic();
	});

	onDestroy(() => {
		gazeFixationEmitter.off('fixationSetStart', evaluateGazeEvent);
	});
</script>

<LessonTaskSyllableLayout isCrossfixVisible={!$wasCrossFixated}>
	<LessonCross {registerElement} {unregisterElement} id={FIXATION_EYE} slot="crossfix-area" />
	<LessonTaskSyllableGrid
		content={[currentContent]}
		{registerElement}
		{unregisterElement}
		{hideAssignmentSyllables}
		isSyllableAssignmentPresent={false}
		assignmentWidth={120}
		syllableGap={12}
		on:correct-syllable-clicked={handleCorrectSyllableClick}
		on:incorrect-syllable-clicked={handleIncorrectSyllableClick}
	/>
</LessonTaskSyllableLayout>
