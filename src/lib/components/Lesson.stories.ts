import type { Meta, StoryObj } from '@storybook/svelte';
import Lesson from './Lesson.svelte';
import {
	createGazeInput,
	GazeInteractionObjectSetFixation,
	GazeInteractionScreenFixation
} from '@473783/develex-core';
import LessonTaskPairedReadingOneContent from './LessonTaskPairedReadingOneContent.svelte';
import type { LessonConfig } from '$lib/types/lesson';
import LessonTaskPairedReadingZeroVoiceContent from './LessonTaskPairedReadingZeroVoiceContent.svelte';
import { SpeechRecognitionMdn } from '$lib/services/SpeechRecognitionMdn';
import { SpeechEvaluatorSimple } from '$lib/services/SpeechEvaluatorSimple';

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
