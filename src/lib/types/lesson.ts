import type { ISpeechEvaluator } from '$lib/interfaces/ISpeechEvaluator';
import type { ISpeechRecognition } from '$lib/interfaces/ISpeechRecognition';
import type { GazeInteractionObjectSetFixation } from '@473783/develex-core';
import type { SvelteComponent } from 'svelte';

export type LessonSvelteComponentEvents = {
	lessonSuccess: CustomEvent<void>;
	lessonMistake: CustomEvent<void>;
	lessonComplete: CustomEvent<void>;
};

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

export type LessonConfig =
	| LessonConfigPairedReadingZero
	| LessonConfigPairedReadingOne
	| LessonConfigPairedReadingZeroVoice;

export type LessonConfigPairedReadingZero = {
	component: LessonSvelteComponentPairedReadingZero;
	content: Array<
		LessonSvelteComponentPairedReadingZero['prototype']['$$prop_def']['currentContent']
	>;
	props: LessonSvelteComponentPairedReadingZero['prototype']['$$prop_def'];
	deInit: () => void;
};

export type LessonConfigPairedReadingOne = {
	component: LessonSvelteComponentPairedReadingOne;
	content: Array<
		LessonSvelteComponentPairedReadingOne['prototype']['$$prop_def']['currentContent']
	>;
	props: LessonSvelteComponentPairedReadingOne['prototype']['$$prop_def'];
	deInit: () => void;
};

export type LessonConfigPairedReadingZeroVoice = {
	component: LessonSvelteComponentPairedReadingZeroVoice;
	content: Array<
		LessonSvelteComponentPairedReadingZeroVoice['prototype']['$$prop_def']['currentContent']
	>;
	props: LessonSvelteComponentPairedReadingZeroVoice['prototype']['$$prop_def'];
	deInit: () => void;
};
