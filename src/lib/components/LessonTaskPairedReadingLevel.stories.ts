import type { Meta, StoryObj } from '@storybook/svelte';
import LessonTaskPairedReadingLevel from './LessonTaskPairedReadingLevel.svelte';
import {
	createGazeInput,
	GazeInteractionObjectFixation,
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
const gazeFixationEmitter = new GazeInteractionObjectFixation();

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
	title: 'Lesson/LessonTaskPairedReadingLevel',
	component: LessonTaskPairedReadingLevel,
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
} satisfies Meta<LessonTaskPairedReadingLevel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		currentContent: {
			text: [['Máma', 'mele', 'maso']],
			evaluationSegment: [
				{
					range: [
						[0, 0],
						[0, 2]
					],
					id: '0'
				}
			]
		},
		bufferSize: 100,
		gazeFixationEmitter: gazeFixationEmitter,
		speechRecognition: speechRecognition,
		speechEvaluator: speechEvaluator,
		wordReader: wordReader,
		shouldListenForVoice: true
	}
};

export const TwoSegments: Story = {
	args: {
		currentContent: {
			text: [
				['Máma', 'mele', 'maso'],
				['Táta', 'mele', 'maso']
			],
			evaluationSegment: [
				{
					range: [
						[0, 0],
						[0, 2]
					],
					id: '0'
				},
				{
					range: [
						[1, 0],
						[1, 2]
					],
					id: '1'
				}
			]
		},
		bufferSize: 100,
		gazeFixationEmitter: gazeFixationEmitter,
		speechRecognition: speechRecognition,
		speechEvaluator: speechEvaluator,
		wordReader: wordReader,
		shouldListenForVoice: true
	}
};
