import type { Meta, StoryObj } from '@storybook/svelte';
import LessonTaskPairedReadingThreeContent from './LessonTaskPairedReadingThreeContent.svelte';
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
	title: 'Lesson/LessonTaskPairedReadingThreeContent',
	component: LessonTaskPairedReadingThreeContent,
	tags: ['autodocs'],
	argTypes: {
		gazeFixationEmitter: {
			control: false,
			defaultValue: mouseGazeInput
		},
		currentContent: {
			control: 'text',
			defaultValue: [
				[
					{
						text: 'Máma',
						id: '1'
					},
					{
						text: 'mele',
						id: '2'
					},
					{
						text: 'maso.',
						id: '3'
					}
				],
				[
					{
						text: 'Táta',
						id: '4'
					},
					{
						text: 'mele',
						id: '5'
					},
					{
						text: 'květiny.',
						id: '6'
					}
				]
			]
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
} satisfies Meta<LessonTaskPairedReadingThreeContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		currentContent: [
			[
				{
					text: 'Máma',
					id: '1'
				},
				{
					text: 'má',
					id: '2'
				},
				{
					text: 'maso.',
					id: '3'
				}
			],
			[
				{
					text: 'Táta',
					id: '4'
				},
				{
					text: 'mele',
					id: '5'
				},
				{
					text: 'květiny.',
					id: '6'
				}
			]
		],
		gazeFixationEmitter: gazeFixationEmitter,
		speechRecognition: speechRecognition,
		speechEvaluator: speechEvaluator,
		wordReader: wordReader
	}
};
