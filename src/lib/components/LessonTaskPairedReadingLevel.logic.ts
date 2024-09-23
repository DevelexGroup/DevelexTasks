import type { ComponentProps, EventDispatcher } from 'svelte';
import type LessonTaskPairedReadingLevel from './LessonTaskPairedReadingLevel.svelte';
import { writable, type Writable } from 'svelte/store';
import type { WordMetadata } from './LessonTaskPairedReadingLevel.utility';

// Define the type for the return object of getLogic
export type GetLogicType = {
	onMount: () => void;
	onDestroy: () => void;
	wordsRegisterFn: (element: HTMLElement) => void;
	wordsUnregisterFn: (element: HTMLElement) => void;
	crossRegisterFn: (element: HTMLElement) => void;
	crossUnregisterFn: (element: HTMLElement) => void;
	wordsStore: Writable<WordMetadata[]>;
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

export const getLogic = (
	params: ComponentProps<LessonTaskPairedReadingLevel>,
	dispatch: EventDispatcher<{
		lessonSuccess: void;
		lessonMistake: void;
		lessonComplete: void;
		lessonFail: void;
	}>
): GetLogicType => {
	/**
	 * States of the task:
	 * ====================
	 * hasFixatedStartCross: Indicates if the user has fixated on the cross.
	 * isFixating: Indicates if the user has fixated on the content.
	 * hasSaidPhrase: Indicates if the user has said the phrase.
	 * showEndCross: Indicates if the end cross should be shown.
	 * hasFixatedEndCross: Indicates if the user has fixated on the cross after saying the phrase.
	 * currentEvaluationSegment: Indicates the current evaluation segment. (Index of the current segment)
	 */
	// const hasFixatedStartCross = writable(false);
	// const isFixating = writable(false);
	// const hasSaidPhrase = writable(false);
	// const showEndCross = writable(false);
	// const hasFixatedEndCross = writable(false);
	// const currentEvaluationSegment = writable(0);

	dispatch('lessonSuccess');
	console.log('params', params);

	const asyncLogic = async () => {
		await new Promise((resolve) => {
			setTimeout(() => {
				resolve(void 0);
			}, 1000);
		});
		dispatch('lessonComplete');
		alert('Lesson complete');
	};

	return {
		onMount: () => {
			console.log('Mounted');
			asyncLogic();
		},
		onDestroy: () => {
			console.log('Destroyed');
		},
		wordsRegisterFn: (element: HTMLElement) => {
			params.gazeFixationEmitter.register(element, {
				bufferSize: params.bufferSize
			});
		},
		wordsUnregisterFn: (element: HTMLElement) => {
			params.gazeFixationEmitter.unregister(element);
		},
		crossRegisterFn: (element: HTMLElement) => {
			params.gazeFixationEmitter.register(element, {
				bufferSize: params.bufferSize
			});
		},
		crossUnregisterFn: (element: HTMLElement) => {
			params.gazeFixationEmitter.unregister(element);
		},

		wordsStore: writable([])
	};
};
