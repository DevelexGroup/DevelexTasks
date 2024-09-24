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

type PairedReadingExtendedFixationEvent =
	| (GazeInteractionObjectFixationEvent & {
			currentlyReadingWord: WordMetadata;
			targetsMatched: (WordMetadata & {
				withinLineDistance: number; // 0 for the exact same position within the line, -1 for fixating on previous word, 1 for fixating on next word, 2 for fixating on the word after the next word, etc.
				betweenLineDistance: number; // 0 for the fixating at the line which is currently being read, -1 for fixating on the previous line, 1 for fixating on the next line, 2 for fixating on the line after the next line, etc.
				totalDistance: number; // Total distance from the current word
			})[];
	  })
	| (GazeInteractionObjectFixationEvent & { currentlyReadingWord: null });

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
	const currentlyReadingWord = writable<WordMetadata | null>(null);

	const abortWrongPatternController = new AbortController();
	const abortController = new AbortController();

	const pairedReadingManager = new PairedReadingManager(params.currentContent);
	const wordsStore = writable<WordMetadata[][]>(pairedReadingManager.getWords());
	const gridStateStore = writable<'crossStart' | 'reading' | 'crossEnd'>('crossStart');

	let wordsFlat = get(wordsStore).flat();

	// Subscribe to the wordsStore and update wordsFlat
	const unsubscribeToWordStore = wordsStore.subscribe((value) => {
		wordsFlat = value.flat();
	});

	/**
	 * Calculates the distance between the current word and the target word.
	 * @param word - The current word metadata.
	 * @param target - The target word metadata.
	 * @returns An object containing distance metrics.
	 */
	const calculateDistance = (word: WordMetadata, target: WordMetadata) => {
		const withinLineDistance = target.lineIndex - word.lineIndex;
		const betweenLineDistance = target.lineIndex - word.lineIndex;
		const totalDistance = target.totalIndex - word.totalIndex;
		return {
			withinLineDistance,
			betweenLineDistance,
			totalDistance
		};
	};

	/**
	 * Calculates an extended fixation event by matching words with the event targets.
	 * @param event - The gaze interaction object fixation event.
	 * @returns The extended fixation event with matched targets and distances.
	 */
	const calculateExtendedEvent = (
		event: GazeInteractionObjectFixationEvent
	): PairedReadingExtendedFixationEvent => {
		// Check how many words from wordsFlat fit to target ids
		const words = wordsFlat.filter((word) => event.target.some((t) => t.id === word.id));

		// If there are words in the target
		if (words.length > 0) {
			const targetsMatched = words.map((word) => {
				const distance = calculateDistance(word, wordsFlat[0]);
				return { ...word, ...distance };
			});
			return {
				...event,
				currentlyReadingWord: get(currentlyReadingWord),
				targetsMatched
			};
		} else {
			const extendedEvent: PairedReadingExtendedFixationEvent = {
				...event,
				currentlyReadingWord: get(currentlyReadingWord),
				targetsMatched: []
			};
			return extendedEvent;
		}
	};

	/**
	 * Evaluates gaze fixations and updates state accordingly.
	 * @param event - The gaze interaction object fixation event.
	 */
	const evaluateFixations = (event: GazeInteractionObjectFixationEvent) => {
		const { target } = event;

		if (target.some((t) => t.id === PairedReadingIdManager.getFixCrossAId())) {
			hasFixatedStartCross.set(true);
		}

		if (target.some((t) => t.id === PairedReadingIdManager.getFixCrossBId())) {
			hasFixatedEndCross.set(true);
		}

		const extendedEvent = calculateExtendedEvent(event);

		if (extendedEvent.currentlyReadingWord === null) return; // If there is no word to read, do not evaluate

		// If any of the targets have distance 0, all is correct
		const isGazePatternCorrect = extendedEvent.targetsMatched.some(
			(target) => target.withinLineDistance === 0
		);

		if (!isGazePatternCorrect) {
			abortWrongPatternController.abort('Wrong fixation pattern');
		}
	};

	/**
	 * Evaluates changes in the reader's current word.
	 * @param word - The current word being read by the reader.
	 */
	const evaluateReaderWordChange = (
		word: {
			text: string;
			id: string;
			start: number;
			end: number;
		} | null
	) => {
		// Match based on the id from wordsStore
		const currentWord = wordsFlat.find((w) => w.id === word?.id) ?? null;
		currentlyReadingWord.set(currentWord);
	};

	/**
	 * Performs a single reading segment.
	 */
	const performSingleReadingSegment = async () => {
		const segment = pairedReadingManager.getReadingSegment();
		await params.wordReader.read([segment]);
		currentlyReadingWord.set(null);
	};

	/**
	 * Performs the reading segments for the task.
	 */
	const performReadingSegments = async () => {
		for await (const segment of params.currentContent.evaluationSegment) {
			wordsStore.set(pairedReadingManager.getWords());
			void segment; // Do not operate with the segment directly
			await retry(
				() => getCancellableAsync(performSingleReadingSegment, abortWrongPatternController.signal),
				{
					retries: 3,
					delay: 3000,
					onRetry: () => {
						params.wordReader.abort();
						dispatch('lessonMistake');
					}
				}
			);
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
		alert('Lesson complete');
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
		unsubscribeToWordStore();
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

		if (target.some((t) => t.id === PairedReadingIdManager.getFixCrossAId())) {
			hasFixatedStartCross.set(true);
		}

		if (target.some((t) => t.id === PairedReadingIdManager.getFixCrossBId())) {
			hasFixatedEndCross.set(true);
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
		alert('Lesson complete');
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
