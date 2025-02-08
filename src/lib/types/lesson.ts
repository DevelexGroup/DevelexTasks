import LessonTaskCibuleLevel from '$lib/components/LessonTaskCibuleLevel.svelte';
import LessonTaskFonologicLevel from '$lib/components/LessonTaskFonologicLevel.svelte';
import LessonTaskPairedReadingLevel from '$lib/components/LessonTaskPairedReadingLevel.svelte';
import LessonTaskSyllableLevel from '$lib/components/LessonTaskSyllableLevel.svelte';
import LessonTaskVisualDiffLevel from '$lib/components/LessonTaskVisualDiffLevel.svelte';
import type { Component, ComponentProps } from 'svelte';

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
}[];

export type CibuleTaskType = {
	syllables: string[];
	correctSyllable?: string;
	incorrectSyllable?: string;
	wordToRead?: string;
	binding?: Record<number, number>;
}[];

export type VisualDiffTaskType = {
	syllables: string[];
	correctSyllable?: string;
	correctGroupIndex?: number;
	groups?: string[][];
	wordToRead?: string;
}[];

export type FonologicTaskType = {
	syllables: string[];
	correctSyllable?: string;
	wordToRead?: string;
	correctIndexes?: number[];
	correctImage?: string;
}[];

export type LessonSvelteComponentEvents = {
	lessonSuccess: CustomEvent<void>;
	lessonMistake: CustomEvent<void>;
	lessonComplete: CustomEvent<void>;
	lessonFail: CustomEvent<void>;
};

export const lessonComponentMap = {
	syllable: LessonTaskSyllableLevel,
	cibule: LessonTaskCibuleLevel,
	pairedReading: LessonTaskPairedReadingLevel,
	visualDiff: LessonTaskVisualDiffLevel,
	fonologic: LessonTaskFonologicLevel
};

export type LessonTypes = keyof typeof lessonComponentMap;

export type LessonComponent = Component<ComponentProps<LessonTaskCibuleLevel>>;

export type LessonConfigBase<T extends LessonTypes> = {
	setup: {
		type: T;
		content: ComponentProps<(typeof lessonComponentMap)[T]>['currentContent'][];
		props: Omit<ComponentProps<(typeof lessonComponentMap)[T]>, 'currentContent'>;
	};
	data: {
		content: ComponentProps<(typeof lessonComponentMap)[T]>['currentContent'][];
		partialProps: Omit<
			ComponentProps<(typeof lessonComponentMap)[T]>,
			| 'currentContent'
			| 'gazeFixationEmitter'
			| 'wordReader'
			| 'speechEvaluator'
			| 'speechRecognition'
		>;
		level: string;
		label?: string;
	};
};

/**
 * Complete configuration map for all lesson types.
 */
export type LessonConfigMap = {
	[K in LessonTypes]: LessonConfigBase<K>;
};

/**
 * Union of all possible lesson configurations.
 */
export type LessonConfig = LessonConfigMap[LessonTypes];
