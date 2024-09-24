import type { ComponentProps, EventDispatcher } from 'svelte';
import type LessonTaskPairedReadingLevel from './LessonTaskPairedReadingLevel.svelte';
import { writable, type Writable } from 'svelte/store';
import {
	PairedReadingIdManager,
	PairedReadingManager,
	type WordMetadata
} from './LessonTaskPairedReadingLevel.utility';
import { waitForConditionCancellable } from '$lib/utils/waitForCondition';
import { browser } from '$app/environment';

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

// export const getLogic = (
// 	params: ComponentProps<LessonTaskPairedReadingLevel>,
// 	dispatch: EventDispatcher<{
// 		lessonSuccess: void;
// 		lessonMistake: void;
// 		lessonComplete: void;
// 		lessonFail: void;
// 	}>
// ): GetLogicType => {
// 	/**
// 	 * States of the task:
// 	 * ====================
// 	 * hasFixatedStartCross: Indicates if the user has fixated on the cross.
// 	 * isFixating: Indicates if the user has fixated on the content.
// 	 * hasSaidPhrase: Indicates if the user has said the phrase.
// 	 * showEndCross: Indicates if the end cross should be shown.
// 	 * hasFixatedEndCross: Indicates if the user has fixated on the cross after saying the phrase.
// 	 * currentEvaluationSegment: Indicates the current evaluation segment. (Index of the current segment)
// 	 */
// 	const hasFixatedStartCross = writable(false);
// 	const isFixating = writable(false);
// 	const hasSaidPhrase = writable(false);
// 	const showEndCross = writable(false);
// 	const hasFixatedEndCross = writable(false);
// 	const currentEvaluationSegment = writable(0);

// 	const abortController = new AbortController();

// 	const pairedReadingManager = new PairedReadingManager(params.currentContent);
// 	const wordsStore = writable<WordMetadata[][]>(pairedReadingManager.getWords());
// 	const gridStateStore = writable<'crossStart' | 'reading' | 'crossEnd'>('crossStart');

// 	const asyncLogic = async () => {
// 		try {
// 			await waitForConditionCancellable(hasFixatedStartCross, 10000, abortController.signal);
// 		} catch (e) {
// 			void e;
// 			dispatch('lessonFail');
// 			return;
// 		}
// 		await waitForConditionCancellable(hasFixatedStartCross, 10000, abortController.signal);
// 		dispatch('lessonComplete');
// 		alert('Lesson complete');
// 	};

// 	return {
// 		onMount: () => {
// 			console.log('Mounted');
// 			asyncLogic();
// 		},
// 		onDestroy: () => {
// 			console.log('Destroyed');
// 		},
// 		wordsRegisterFn: (element: HTMLElement) => {
// 			params.gazeFixationEmitter.register(element, {
// 				bufferSize: params.bufferSize
// 			});
// 		},
// 		wordsUnregisterFn: (element: HTMLElement) => {
// 			params.gazeFixationEmitter.unregister(element);
// 		},
// 		crossRegisterFn: (element: HTMLElement) => {
// 			params.gazeFixationEmitter.register(element, {
// 				bufferSize: params.bufferSize
// 			});
// 		},
// 		crossUnregisterFn: (element: HTMLElement) => {
// 			params.gazeFixationEmitter.unregister(element);
// 		},

// 		wordsStore,
// 		gridStateStore
// 	};
// };

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
	const evaluateFixations = (event: GazeInteractionObjectSetFixationEvent) => {
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
		params.gazeFixationEmitter.on('fixationSetStart', evaluateFixations);
	};

	// Logic to execute when the component is destroyed
	const onDestroyLogic = () => {
		unregisterKeyInput();
		abortController.abort('Task destroyed');
		params.gazeFixationEmitter.off('fixationSetStart', evaluateFixations);
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
