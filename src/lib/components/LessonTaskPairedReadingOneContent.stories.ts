import type { Meta, StoryObj } from '@storybook/svelte';
import LessonTaskPairedReadingOneContent from './LessonTaskPairedReadingOneContent.svelte';
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
	title: 'Lesson/LessonTaskPairedReadingOneContent',
	component: LessonTaskPairedReadingOneContent,
	tags: ['autodocs'],
	argTypes: {
		gazeFixationEmitter: {
			control: false,
			defaultValue: mouseGazeInput
		},
		currentContent: {
			control: 'object',
			defaultValue: ['Máma', 'mele', 'maso.']
		}
	},
	parameters: {
		docs: {
			description: {
				component: 'You will start the fake gaze input by clicking on the document.'
			}
		}
	}
} satisfies Meta<LessonTaskPairedReadingOneContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		currentContent: ['Máma', 'mele', 'maso.'],
		gazeFixationEmitter: gazeFixationEmitter
	}
};
