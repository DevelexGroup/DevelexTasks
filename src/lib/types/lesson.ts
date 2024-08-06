import type { ISpeechEvaluator } from '$lib/interfaces/ISpeechEvaluator';
import type { ISpeechRecognition } from '$lib/interfaces/ISpeechRecognition';
import type { IWordReader } from '$lib/interfaces/IWordReader';
import type { GazeInteractionObjectSetFixation } from '@473783/develex-core';
import type { SvelteComponent } from 'svelte';

export type LessonWordType = {
	text: string;
	id: string;
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

export type LessonConfigBase<T extends LessonSvelteComponentBase> = {
	component: T;
	content: Array<T['prototype']['$$prop_def']['currentContent']>;
	props: T['prototype']['$$prop_def'];
	deInit: () => void;
};

export type LessonConfigPairedReadingZero =
	LessonConfigBase<LessonSvelteComponentPairedReadingZero>;

export type LessonConfigPairedReadingOne = LessonConfigBase<LessonSvelteComponentPairedReadingOne>;

export type LessonConfigPairedReadingZeroVoice =
	LessonConfigBase<LessonSvelteComponentPairedReadingZeroVoice>;

export type LessonConfigPairedReadingTwo = LessonConfigBase<LessonSvelteComponentPairedReadingTwo>;

export type LessonConfigPairedReadingThree =
	LessonConfigBase<LessonSvelteComponentPairedReadingThree>;

export type LessonConfig =
	| LessonConfigPairedReadingZero
	| LessonConfigPairedReadingOne
	| LessonConfigPairedReadingZeroVoice
	| LessonConfigPairedReadingTwo
	| LessonConfigPairedReadingThree;
