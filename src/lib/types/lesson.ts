import type LessonTaskCibuleLevel from '$lib/components/LessonTaskCibuleLevel.svelte';
import type LessonTaskPairedReadingLevel from '$lib/components/LessonTaskPairedReadingLevel.svelte';
import type LessonTaskSyllableLevel from '$lib/components/LessonTaskSyllableLevel.svelte';
import type { GazeInput, GazeInputConfig } from '@473783/develex-core';
import type { ComponentProps, SvelteComponent_1 } from 'svelte';

export type LessonWordType = {
	text: string;
	id: string;
};

/**
 * The type of the paired reading task.
 * @example
 * {
 * 	text: [
 * 		['The', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog.'],
 * 		['The', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'cat.']
 * 	],
 * 	evaluationSegment: [
 * 		{
 * 			range: [[0, 0], [0, 2]],
 * 			id: 'fixw-0-0'
 * 		},
 * 		{
 * 			range: [[1, 0], [1, 2]],
 * 			id: 'fixw-1-0'
 * 		}
 * 	]
 */
export type PairedReadingTaskType = {
	text: string[][]; // The text to display, divided into segments and lines.
	evaluationSegment: {
		range: [[number, number], [number, number]]; // The range of the segment [start, end] with [line, word] indexes.
		id: string;
	}[];
};

export type SyllableTaskType = {
	syllables: string[];
	correctSyllable: string;
};

export type CibuleTaskType = {
	syllables: string[];
	correctSyllable?: string;
	incorrectSyllable?: string;
};

export type LessonSvelteComponentEvents = {
	lessonSuccess: CustomEvent<void>;
	lessonMistake: CustomEvent<void>;
	lessonComplete: CustomEvent<void>;
	lessonFail: CustomEvent<void>;
};

export type LessonConfigBase<T extends MandatoryLessonComponentStructure> = {
	setup: {
		component: T;
		content: ComponentProps<T>['currentContent'][];
		props: ComponentProps<T>;
		deInit: () => void;
		gazeInput: GazeInput<GazeInputConfig>;
	};
	data: {
		content: ComponentProps<T>['currentContent'][];
		partialProps: Omit<
			ComponentProps<T>,
			'currentContent' | 'gazeFixationEmitter' | 'wordReader' | 'speechEvaluator'
		>;
		level: string;
	};
};

type MandatoryLessonComponentStructure = SvelteComponent_1<
	{
		currentContent: unknown;
	},
	LessonSvelteComponentEvents
>;

export type LessonConfigSyllables = LessonConfigBase<LessonTaskSyllableLevel>;
export type LessonConfigCibule = LessonConfigBase<LessonTaskCibuleLevel>;
export type LessonConfigPairedReading = LessonConfigBase<LessonTaskPairedReadingLevel>;

export type LessonConfig = LessonConfigSyllables | LessonConfigCibule | LessonConfigPairedReading;
