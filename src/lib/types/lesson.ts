import type { GazeInteractionObjectSetFixation } from '@473783/develex-core';
import type { SvelteComponent } from 'svelte';

export type LessonWordType = {
	word: string;
	id: number;
};

export type LessonSvelteComponentEvents = {
	lessonSuccess: CustomEvent<void>;
	lessonMistake: CustomEvent<void>;
	lessonComplete: CustomEvent<void>;
};

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

export type LessonConfig = LessonConfigPairedReadingZero | LessonConfigPairedReadingOne;

export type LessonConfigPairedReadingZero = {
	component: LessonSvelteComponentPairedReadingZero;
	content: Array<
		LessonSvelteComponentPairedReadingZero['prototype']['$$prop_def']['currentContent']
	>;
	gazeInteractionObjectSetFixation: GazeInteractionObjectSetFixation;
};

export type LessonConfigPairedReadingOne = {
	component: LessonSvelteComponentPairedReadingOne;
	content: Array<
		LessonSvelteComponentPairedReadingOne['prototype']['$$prop_def']['currentContent']
	>;
	gazeInteractionObjectSetFixation: GazeInteractionObjectSetFixation;
};
