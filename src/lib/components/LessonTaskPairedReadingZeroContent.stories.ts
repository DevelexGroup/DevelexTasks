import type { Meta, StoryObj } from '@storybook/svelte';
import LessonTaskPairedReadingZeroContent from './LessonTaskPairedReadingZeroContent.svelte';
import {
	createGazeInput,
	GazeInteractionObjectSetFixation,
	GazeInteractionScreenFixation
} from '@473783/develex-core';

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
	title: 'Lesson/LessonTaskPairedReadingZeroContent',
	component: LessonTaskPairedReadingZeroContent,
	tags: ['autodocs'],
	argTypes: {
		gazeFixationEmitter: {
			control: false,
			defaultValue: mouseGazeInput
		},
		currentContent: {
			control: 'text',
			defaultValue: 'Máma'
		}
	},
	parameters: {
		docs: {
			description: {
				component: 'You will start the fake gaze input by clicking on the document.'
			}
		}
	}
} satisfies Meta<LessonTaskPairedReadingZeroContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		currentContent: 'Máma',
		gazeFixationEmitter: gazeFixationEmitter
	}
};
