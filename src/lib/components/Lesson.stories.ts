import type { Meta, StoryObj } from '@storybook/svelte';
import Lesson from './Lesson.svelte';
import {
	createGazeInput,
	GazeInteractionObjectSetFixation,
	GazeInteractionScreenFixation
} from '@473783/develex-core';
import LessonTaskPairedReadingOneContent from './LessonTaskPairedReadingOneContent.svelte';
import type { LessonConfig, LessonConfigPairedReadingThree } from '$lib/types/lesson';
import LessonTaskPairedReadingZeroVoiceContent from './LessonTaskPairedReadingZeroVoiceContent.svelte';
import { SpeechRecognitionMdn } from '$lib/services/SpeechRecognitionMdn';
import { SpeechEvaluatorSimple } from '$lib/services/SpeechEvaluatorSimple';
import { WordReaderSynthesis } from '$lib/services/WordReaderSynthesis';
import LessonTaskPairedReadingThreeContent from './LessonTaskPairedReadingThreeContent.svelte';

// it resolves on click in document
const lessonConfig: Promise<LessonConfig> = new Promise((resolve) => {
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

	// expect error
	//@ts-expect-error error in lib
	gazeFixationDetector.connect(mouseGazeInput);
	gazeFixationEmitter.connect(gazeFixationDetector);

	const deInit = () => {
		if (mouseGazeInput.isEmitting) mouseGazeInput.stop();
		if (mouseGazeInput.isConnected) mouseGazeInput.disconnect();
	};

	document.addEventListener('dblclick', (e) => {
		mouseGazeInput.setWindowCalibration(e, window);
		if (!mouseGazeInput.isConnected) mouseGazeInput.connect();
		if (!mouseGazeInput.isEmitting) mouseGazeInput.start();
		resolve({
			component: LessonTaskPairedReadingOneContent,
			content: [
				['Máma', 'mele', 'maso.'],
				['Teta', 'táta', 'teta.']
			],
			props: {
				gazeFixationEmitter
			},
			deInit
		});
	});
});

const lessonConfigTwo: Promise<LessonConfig> = new Promise((resolve) => {
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

	// expect error
	//@ts-expect-error error in lib
	gazeFixationDetector.connect(mouseGazeInput);
	gazeFixationEmitter.connect(gazeFixationDetector);

	const deInit = () => {
		if (mouseGazeInput.isEmitting) mouseGazeInput.stop();
		if (mouseGazeInput.isConnected) mouseGazeInput.disconnect();
	};

	const speechRecognition = new SpeechRecognitionMdn();
	const speechEvaluator = new SpeechEvaluatorSimple();
	document.addEventListener('dblclick', (e) => {
		mouseGazeInput.setWindowCalibration(e, window);
		if (!mouseGazeInput.isConnected) mouseGazeInput.connect();
		if (!mouseGazeInput.isEmitting) mouseGazeInput.start();
		resolve({
			component: LessonTaskPairedReadingZeroVoiceContent,
			content: ['Máma', 'mele', 'maso.'],
			props: {
				gazeFixationEmitter,
				speechRecognition: speechRecognition,
				speechEvaluator: speechEvaluator
			},
			deInit
		});
	});
});

const lessonConfigThree: Promise<LessonConfig> = new Promise((resolve) => {
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

	// expect error
	//@ts-expect-error error in lib
	gazeFixationDetector.connect(mouseGazeInput);
	gazeFixationEmitter.connect(gazeFixationDetector);

	const deInit = () => {
		if (mouseGazeInput.isEmitting) mouseGazeInput.stop();
		if (mouseGazeInput.isConnected) mouseGazeInput.disconnect();
	};

	const speechRecognition = new SpeechRecognitionMdn();
	const speechEvaluator = new SpeechEvaluatorSimple();
	const wordReader = new WordReaderSynthesis();

	document.addEventListener('dblclick', (e) => {
		mouseGazeInput.setWindowCalibration(e, window);
		if (!mouseGazeInput.isConnected) mouseGazeInput.connect();
		if (!mouseGazeInput.isEmitting) mouseGazeInput.start();

		const lessonConfig: LessonConfigPairedReadingThree = {
			component: LessonTaskPairedReadingThreeContent,
			content: [
				[
					[
						{
							text: 'Byla',
							id: '1'
						},
						{
							text: 'jednou',
							id: '2'
						},
						{
							text: 'jedna',
							id: '3'
						},
						{
							text: 'slepice.',
							id: '4'
						}
					],
					[
						{
							text: 'Slepice',
							id: '5'
						},
						{
							text: 'se',
							id: '6'
						},
						{
							text: 'jmenovala',
							id: '7'
						},
						{
							text: 'Kokoska.',
							id: '8'
						}
					],
					[
						{
							text: 'Kokoska',
							id: '9'
						},
						{
							text: 'měla',
							id: '10'
						},
						{
							text: 'dvě',
							id: '11'
						},
						{
							text: 'křídla.',
							id: '12'
						}
					]
				],
				[
					[
						{
							text: 'Kokoska',
							id: '13'
						},
						{
							text: 'se',
							id: '14'
						},
						{
							text: 'naučila',
							id: '15'
						},
						{
							text: 'létat.',
							id: '16'
						}
					],
					[
						{
							text: 'Kokoska',
							id: '17'
						},
						{
							text: 'létala',
							id: '18'
						},
						{
							text: 'do',
							id: '19'
						},
						{
							text: 'dáli.',
							id: '20'
						}
					]
				]
			],
			props: {
				gazeFixationEmitter,
				speechRecognition,
				speechEvaluator,
				wordReader
			},
			deInit
		};

		resolve(lessonConfig);
	});
});

const meta = {
	title: 'Lesson/Lesson',
	component: Lesson,
	tags: ['autodocs'],
	argTypes: {
		lessonConfig: {
			control: false,
			defaultValue: lessonConfig
		}
	},
	parameters: {
		docs: {
			description: {
				component: 'Lesson component. You will stop the load by clicking on the document.'
			}
		}
	}
} satisfies Meta<Lesson>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		lessonConfig: lessonConfig
	}
};

export const DefaultTwo: Story = {
	args: {
		lessonConfig: lessonConfigTwo
	}
};

export const PairedReadingThree: Story = {
	args: {
		lessonConfig: lessonConfigThree
	}
};
