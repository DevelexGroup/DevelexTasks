import type { Meta, StoryObj } from '@storybook/svelte';
import LessonTaskSyllableLevel from './LessonTaskSyllableLevel.svelte';
import {
	createGazeInput,
	GazeInteractionObjectFixation,
	GazeInteractionScreenFixation
} from '@473783/develex-core';
import { WordReaderSynthesis } from '$lib/services/WordReaderSynthesis';

const mouseGazeInput = createGazeInput({
	tracker: 'dummy',
	fixationDetection: 'idt',
	frequency: 60,
	precisionMinimalError: 0.5,
	precisionDecayRate: 0.1,
	precisionMaximumError: 1
});

const gazeFixationDetector = new GazeInteractionScreenFixation();
const gazeFixationEmitter = new GazeInteractionObjectFixation();

const wordReader = new WordReaderSynthesis();

// expect error
//@ts-expect-error error in lib
gazeFixationDetector.connect(mouseGazeInput);
gazeFixationEmitter.connect(gazeFixationDetector);

document.addEventListener(
	'click',
	(event: MouseEvent) => {
		mouseGazeInput.setWindowCalibration(event, window);
		mouseGazeInput.connect();
		mouseGazeInput.start();
	},
	{ once: true }
);

const meta = {
	title: 'Lesson/LessonTaskSyllableLevel',
	component: LessonTaskSyllableLevel,
	tags: ['autodocs'],
	argTypes: {
		gazeFixationEmitter: {
			control: false,
			defaultValue: mouseGazeInput
		},
		currentContent: {
			control: 'text',
			defaultValue: {
				correctSyllable: 'ma',
				syllables: ['ma', 'ma', 'so']
			}
		},
		wordReader: {
			control: false,
			defaultValue: wordReader
		}
	},
	parameters: {
		docs: {
			description: {
				component: 'You will start the fake gaze input by doubleclicking on the document.'
			}
		}
	}
} satisfies Meta<LessonTaskSyllableLevel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		currentContent: [
			{
				correctSyllable: 'ma',
				syllables: ['ma', 'ma', 'so']
			}
		],
		gazeFixationEmitter: gazeFixationEmitter,
		wordReader: wordReader
	}
};

export const DefaultMultiple: Story = {
	args: {
		currentContent: [
			{
				correctSyllable: 'ma',
				syllables: ['ma', 'ma', 'so']
			},
			{
				correctSyllable: 'ba',
				syllables: ['ba', 'ma', 'ro']
			}
		],
		gazeFixationEmitter: gazeFixationEmitter,
		wordReader: wordReader
	}
};
