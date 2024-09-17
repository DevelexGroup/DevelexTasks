import type LessonTaskCibuleLevel from '$lib/components/LessonTaskCibuleLevel.svelte';
import type LessonTaskPairedReadingLevel from '$lib/components/LessonTaskPairedReadingLevel.svelte';
import type LessonTaskSyllableLevel from '$lib/components/LessonTaskSyllableLevel.svelte';
import type { ISpeechEvaluator } from '$lib/interfaces/ISpeechEvaluator';
import type { ISpeechRecognition } from '$lib/interfaces/ISpeechRecognition';
import type { IWordReader } from '$lib/interfaces/IWordReader';
import type {
	GazeInput,
	GazeInputConfig,
	GazeInteractionObjectSetFixation
} from '@473783/develex-core';
import type { SvelteComponent, ComponentType } from 'svelte';

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

export type LessonSvelteComponentBase = typeof SvelteComponent<
	{
		// Props
		/**
		 * The text to display.
		 */
		currentContent: unknown;
	},
	LessonSvelteComponentEvents
>;

export type LessonSvelteComponentPairedReadingZeroVoice = typeof SvelteComponent<
	{
		// Props
		/**
		 * The text to display.
		 */
		gazeFixationEmitter: GazeInteractionObjectSetFixation;
		currentContent: string;
		speechEvaluator: ISpeechEvaluator;
		speechRecognition: ISpeechRecognition;
	},
	LessonSvelteComponentEvents
>;

export type LessonSvelteComponentPairedReadingZero = typeof SvelteComponent<
	{
		// Props
		/**
		 * The text to display.
		 */
		gazeFixationEmitter: GazeInteractionObjectSetFixation;
		currentContent: string;
	},
	LessonSvelteComponentEvents
>;

export type LessonSvelteComponentPairedReadingOne = typeof SvelteComponent<
	{
		// Props
		/**
		 * The text to display.
		 */
		gazeFixationEmitter: GazeInteractionObjectSetFixation;
		currentContent: string[];
	},
	LessonSvelteComponentEvents
>;

export type LessonSvelteComponentPairedReadingTwo = typeof SvelteComponent<
	{
		gazeFixationEmitter: GazeInteractionObjectSetFixation;
		currentContent: string[];
		wordReader: IWordReader;
		speechEvaluator: ISpeechEvaluator;
		speechRecognition: ISpeechRecognition;
	},
	LessonSvelteComponentEvents
>;

export type LessonSvelteComponentPairedReadingThree = typeof SvelteComponent<
	{
		gazeFixationEmitter: GazeInteractionObjectSetFixation;
		currentContent: { text: string; id: string }[][];
		wordReader: IWordReader;
		speechEvaluator: ISpeechEvaluator;
		speechRecognition: ISpeechRecognition;
		shouldHighlightWords: boolean;
	},
	LessonSvelteComponentEvents
>;

export type LessonSvelteComponentSyllables = ComponentType<LessonTaskSyllableLevel>;
export type LessonSvelteComponentCibule = ComponentType<LessonTaskCibuleLevel>;
export type LessonSvelteComponentPairedReading = ComponentType<LessonTaskPairedReadingLevel>;

export type LessonConfigBase<T extends LessonSvelteComponentBase> = {
	component: T;
	content: T['prototype']['$$prop_def']['currentContent'][];
	props: T['prototype']['$$prop_def'];
	deInit: () => void;
	gazeInput: GazeInput<GazeInputConfig>;
};

export type LessonConfigPairedReadingZero =
	LessonConfigBase<LessonSvelteComponentPairedReadingZero>;

export type LessonConfigPairedReadingOne = LessonConfigBase<LessonSvelteComponentPairedReadingOne>;

export type LessonConfigPairedReadingZeroVoice =
	LessonConfigBase<LessonSvelteComponentPairedReadingZeroVoice>;

export type LessonConfigPairedReadingTwo = LessonConfigBase<LessonSvelteComponentPairedReadingTwo>;

export type LessonConfigPairedReadingThree =
	LessonConfigBase<LessonSvelteComponentPairedReadingThree>;

export type LessonConfigSyllables = LessonConfigBase<LessonSvelteComponentSyllables>;
export type LessonConfigCibule = LessonConfigBase<LessonSvelteComponentCibule>;
export type LessonConfigPairedReading = LessonConfigBase<LessonSvelteComponentPairedReading>;

export type LessonConfig =
	| LessonConfigPairedReadingZero
	| LessonConfigPairedReadingOne
	| LessonConfigPairedReadingZeroVoice
	| LessonConfigPairedReadingTwo
	| LessonConfigPairedReadingThree
	| LessonConfigSyllables
	| LessonConfigCibule;
