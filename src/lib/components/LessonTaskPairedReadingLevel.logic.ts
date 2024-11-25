import type { ComponentProps, EventDispatcher } from 'svelte';
import type LessonTaskPairedReadingLevel from './LessonTaskPairedReadingLevel.svelte';
import { get, writable, type Writable } from 'svelte/store';
import {
	PairedReadingIdManager,
	PairedReadingManager,
	type WordMetadata
} from './LessonTaskPairedReadingLevel.utility';
import { getCancellableAsync, waitForConditionCancellable } from '$lib/utils/waitForCondition';
import { browser } from '$app/environment';
import type { GazeInteractionObjectFixationEvent } from '@473783/develex-core';
import { retry } from '$lib/utils/retry';

// Define the type for the return object of getLogic
export type GetLogicType = {
	onMountLogic: () => void;
	onDestroyLogic: () => void;
	wordsRegisterFn: (element: HTMLElement) => void;
	wordsUnregisterFn: (element: HTMLElement) => void;
	crossRegisterFn: (element: HTMLElement) => void;
	crossUnregisterFn: (element: HTMLElement) => void;
	wordsStore: Writable<WordMetadata[][]>;
	gridStateStore: Writable<'crossStart' | 'reading' | 'crossEnd'>;
};

// Define the getLogic function type
export type GetLogicFunction = (
	params: ComponentProps<LessonTaskPairedReadingLevel>,
	dispatch: EventDispatcher<{
		lessonSuccess: void;
		lessonMistake: void;
		lessonComplete: void;
		lessonFail: void;
	}>
) => GetLogicType;

/**
	 * 
	 * @param params 
	 * @param dispatch 
	 * @returns
	 * @startuml
start

:fixationCrossStart - Await fixation on the start cross 
(up to [n] seconds);

if (Fixation successful?) then (Yes)
  :lessonSuccess - Start fixation achieved;
  :Display all text segments without highlighting;
else (No)
  :lessonFail - Failed to fixate on start cross;
  stop
endif

repeat
  :Read whole segment outloud;

  if (User starts fixation on the word which is not currently read out loud) then (No)
    :Continue reading to the end of the segment;
    
    :lessonSuccess - Segment completed successfully;
    :Move to the next segment;
  else (Yes)
    :lessonMistake - Incorrect gaze pattern detected;
    
    :Retry up to 3 times with delays of [n] seconds each;
    
    if (All retries failed?) then (Yes)
      :lessonFail - Task interrupted;
      stop
    endif
  endif
repeat while (More segments to read?)

:All segments read successfully;
:fixationCrossEnd - Await fixation on the end cross 
(up to [n] seconds);

if (Fixation successful?) then (Yes)
  :lessonComplete - Task completed successfully;
  stop
else (No)
  :lessonFail - Failed to fixate on end cross;
  stop
endif
@enduml
	 */
export const getLogic = (
	params: ComponentProps<LessonTaskPairedReadingLevel>,
	dispatch: EventDispatcher<{
		lessonSuccess: void;
		lessonMistake: void;
		lessonComplete: void;
		lessonFail: void;
	}>
): GetLogicType => {
	// State variables
	const hasFixatedStartCross = writable(false);
	const hasFixatedEndCross = writable(false);
	const currentlyReadingPhrase = writable<{
		text: string;
		id: string;
	} | null>(null);
	let gazeMistakesDuringReading: number = 0;
	const abortController = new AbortController();

	const pairedReadingManager = new PairedReadingManager(params.currentContent);
	const wordsStore = writable<WordMetadata[][]>(pairedReadingManager.getWords());
	const gridStateStore = writable<'crossStart' | 'reading' | 'crossEnd'>('crossStart');

	/**
	 * Evaluates gaze fixations and updates state accordingly.
	 * @param event - The gaze interaction object fixation event.
	 */
	const evaluateFixations = (event: GazeInteractionObjectFixationEvent) => {
		const { target } = event;

		console.log(target);

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

		// If any of the targets have distance 0, all is correct
		const phrase = get(currentlyReadingPhrase);
		if (!phrase || get(gridStateStore) !== 'reading') return;
		const isGazePatternCorrect = target.some((target) =>
			PairedReadingIdManager.isWordInEvaluationSegmentByIndex(
				phrase.id,
				target.id,
				params.currentContent
			)
		);

		if (!isGazePatternCorrect) {
			gazeMistakesDuringReading++;
		}
	};

	/**
	 * Evaluates changes in the reader's current word.
	 * @param word - The current word being read by the reader.
	 */
	const evaluateReaderWordChange = (
		phrase: {
			text: string;
			id: string;
		} | null
	) => {
		currentlyReadingPhrase.set(phrase);
	};

	/**
	 * Performs a single reading segment.
	 */
	const performSingleReadingSegment = async () => {
		const segment = pairedReadingManager.getReadingSegment();
		gazeMistakesDuringReading = 0;
		await params.wordReader.read([segment]);
		if (gazeMistakesDuringReading > 1) throw new Error('Too many mistakes');
		currentlyReadingPhrase.set(null);
	};

	/**
	 * Performs the reading segments for the task.
	 */
	const performReadingSegments = async () => {
		for await (const segment of params.currentContent.evaluationSegment) {
			wordsStore.set(pairedReadingManager.getWords());
			void segment; // Do not operate with the segment directly
			await retry(() => getCancellableAsync(performSingleReadingSegment, abortController.signal), {
				retries: 3,
				delay: 5000,
				onRetry: () => {
					params.wordReader.abort();
					dispatch('lessonMistake');
				}
			});
			pairedReadingManager.nextSegment();
			dispatch('lessonSuccess');
		}
	};

	/**
	 * Performs waiting for the start cross fixation.
	 * @returns A promise that resolves to true if fixation is detected, false otherwise.
	 */
	const performWaitForStartCrossFixation = async () => {
		try {
			await waitForConditionCancellable(hasFixatedStartCross, 100000, abortController.signal);
			return true;
		} catch {
			dispatch('lessonFail');
			return false;
		}
	};

	/**
	 * Performs waiting for the end cross fixation.
	 */
	const performWaitForEndCrossFixation = async () => {
		await waitForConditionCancellable(hasFixatedEndCross, 100000, abortController.signal);
		dispatch('lessonComplete');
	};

	/**
	 * Main function to perform the task logic asynchronously.
	 */
	const performTask = async () => {
		const started = await performWaitForStartCrossFixation();
		if (!started) return;

		gridStateStore.set('reading');
		await performReadingSegments();

		gridStateStore.set('crossEnd');
		await performWaitForEndCrossFixation();
	};

	/**
	 * Registers a gaze fixation element.
	 * @param element - The HTML element to register.
	 */
	const setupRegisterElement = (element: HTMLElement) => {
		params.gazeFixationEmitter.register(element, {
			bufferSize: params.bufferSize
		});
	};

	/**
	 * Unregisters a gaze fixation element.
	 * @param element - The HTML element to unregister.
	 */
	const setupUnregisterElement = (element: HTMLElement) => {
		params.gazeFixationEmitter.unregister(element);
	};

	/**
	 * Logic to execute when the component is mounted.
	 */
	const setupOnMount = () => {
		params.wordReader.onWordChange = evaluateReaderWordChange;
		performTask();
		params.gazeFixationEmitter.on('fixationObjectStart', evaluateFixations);
	};

	/**
	 * Logic to execute when the component is destroyed.
	 */
	const setupOnDestroy = () => {
		abortController.abort('Task destroyed');
		params.gazeFixationEmitter.off('fixationObjectStart', evaluateFixations);
	};

	return {
		onMountLogic: setupOnMount,
		onDestroyLogic: setupOnDestroy,
		wordsRegisterFn: setupRegisterElement,
		wordsUnregisterFn: setupUnregisterElement,
		crossRegisterFn: setupRegisterElement,
		crossUnregisterFn: setupUnregisterElement,
		wordsStore,
		gridStateStore
	};
};

/**
 * Logic for the pilot version of the Paired Reading lesson task.
 * It is very permissive and its main purpose is to collect eye movement data of participants without much interference from gaze control.
 * @param params of the Paired Reading task
 * @param dispatch event dispatcher for the lesson task
 * @returns logic object for the paired reading task
@startuml
start

:fixationCrossStart - Await fixation on the start cross (focus on the starting point) 
(up to [n] seconds);

if (Fixation successful?) then (Yes)
  :lessonSuccess - Start fixation achieved;
  :Begin reading process (show all text segments);
else (No)
  :lessonFail - Failed to fixate on start cross;
  stop
endif

repeat
  :Highlight a segment of the text;
  :Wait for operator confirmation to proceed 
  (up to [n] seconds);
  
  if (Operator confirms?) then (Yes)
    :lessonSuccess - Segment completed;
    :Move to the next segment;
  else (No)
    :lessonFail - Task interrupted;
    stop
  endif
repeat while (More segments to read?)

:All segments read successfully;
:fixationCrossEnd - Await fixation on the end cross (focus on the ending point) 
(up to [n] seconds);

if (Fixation successful?) then (Yes)
  :lessonComplete - Task completed successfully;
  stop
else (No)
  :lessonFail - Failed to fixate on end cross;
  stop
endif

@enduml
 */
export const getPilotLogic: GetLogicFunction = (params, dispatch) => {
	// State variables
	const hasFixatedStartCross = writable(false);
	const hasFixatedEndCross = writable(false);
	const hasOperatorConfirmedSegment = writable(false);

	const abortController = new AbortController();
	const pairedReadingManager = new PairedReadingManager(params.currentContent);
	const wordsStore = writable<WordMetadata[][]>(pairedReadingManager.getWords());
	const gridStateStore = writable<'crossStart' | 'reading' | 'crossEnd'>('crossStart');

	// Register and unregister functions for gaze fixation elements
	const register = (element: HTMLElement) => {
		params.gazeFixationEmitter.register(element, {
			bufferSize: params.bufferSize
		});
	};

	const unregister = (element: HTMLElement) => {
		params.gazeFixationEmitter.unregister(element);
	};

	// Function to evaluate gaze fixations
	const evaluateFixations = (event: GazeInteractionObjectFixationEvent) => {
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
	};

	// Function to wait for the start cross fixation
	const waitForStartCrossFixation = async () => {
		try {
			await waitForConditionCancellable(hasFixatedStartCross, 100000, abortController.signal);
			return true;
		} catch {
			dispatch('lessonFail');
			return false;
		}
	};

	// Function to perform reading segments
	const performReadingSegments = async () => {
		for await (const segment of params.currentContent.evaluationSegment) {
			wordsStore.set(pairedReadingManager.getWords());
			void segment; // do not operate with the segment directly
			const words = pairedReadingManager.getReadingSegment();
			void params.wordReader.read([words]);
			await waitForConditionCancellable(
				hasOperatorConfirmedSegment,
				100000,
				abortController.signal
			);
			hasOperatorConfirmedSegment.set(false);
			pairedReadingManager.nextSegment();
			console.log('Segment complete');
			dispatch('lessonSuccess');
		}
	};

	// Function to wait for the end cross fixation
	const waitForEndCrossFixation = async () => {
		await waitForConditionCancellable(hasFixatedEndCross, 100000, abortController.signal);
		dispatch('lessonComplete');
	};

	// Main asynchronous logic
	const asyncLogic = async () => {
		const started = await waitForStartCrossFixation();
		if (!started) return;

		gridStateStore.set('reading');
		await performReadingSegments();

		gridStateStore.set('crossEnd');
		await waitForEndCrossFixation();
	};

	// Keyboard event handler
	const keyDownHandler = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			hasOperatorConfirmedSegment.set(true);
		}
	};

	// Register keyboard input
	const registerKeyInput = () => {
		if (browser) {
			window.addEventListener('keydown', keyDownHandler);
		}
	};

	// Unregister keyboard input
	const unregisterKeyInput = () => {
		if (browser) {
			window.removeEventListener('keydown', keyDownHandler);
		}
	};

	// Logic to execute when the component is mounted
	const onMountLogic = () => {
		registerKeyInput();
		asyncLogic();
		params.gazeFixationEmitter.on('fixationObjectStart', evaluateFixations);
	};

	// Logic to execute when the component is destroyed
	const onDestroyLogic = () => {
		unregisterKeyInput();
		abortController.abort('Task destroyed');
		params.gazeFixationEmitter.off('fixationObjectStart', evaluateFixations);
	};

	return {
		onMountLogic,
		onDestroyLogic,
		wordsRegisterFn: register,
		wordsUnregisterFn: unregister,
		crossRegisterFn: register,
		crossUnregisterFn: unregister,
		wordsStore,
		gridStateStore
	};
};
