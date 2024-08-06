import type { Meta, StoryObj } from '@storybook/svelte';
import LessonTaskPairedReadingTwoContent from './LessonTaskPairedReadingTwoContent.svelte';
import {
	createGazeInput,
	GazeInteractionObjectSetFixation,
	GazeInteractionScreenFixation
} from '@473783/develex-core';
import { SpeechRecognitionMdn } from '$lib/services/SpeechRecognitionMdn';
import { SpeechEvaluatorSimple } from '$lib/services/SpeechEvaluatorSimple';
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
const gazeFixationEmitter = new GazeInteractionObjectSetFixation();

const speechRecognition = new SpeechRecognitionMdn();
const speechEvaluator = new SpeechEvaluatorSimple();

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
	title: 'Lesson/LessonTaskPairedReadingTwoContent',
	component: LessonTaskPairedReadingTwoContent,
	tags: ['autodocs'],
	argTypes: {
		gazeFixationEmitter: {
			control: false,
			defaultValue: mouseGazeInput
		},
		currentContent: {
			control: 'text',
			defaultValue: 'Máma'
		},
		speechRecognition: {
			control: false,
			defaultValue: speechRecognition
		},
		speechEvaluator: {
			control: false,
			defaultValue: speechEvaluator
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
} satisfies Meta<LessonTaskPairedReadingTwoContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		currentContent: ['Máma', 'mele', 'maso.'],
		gazeFixationEmitter: gazeFixationEmitter,
		speechRecognition: speechRecognition,
		speechEvaluator: speechEvaluator,
		wordReader: wordReader
	}
};
