import type { Meta, StoryObj } from '@storybook/svelte';
import LessonFrame from './LessonFrame.svelte';
import {
	createGazeInput,
	GazeInteractionObjectFixation,
	GazeInteractionScreenFixation
} from '@473783/develex-core';
import LessonTaskPairedReadingOneContent from './LessonTaskPairedReadingOneContent.svelte';

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
	title: 'Lesson/LessonFrame',
	component: LessonFrame,
	tags: ['autodocs'],
	argTypes: {
		gazeInteractionObjectFixation: {
			control: false,
			defaultValue: gazeFixationEmitter
		},
		lessonConfigResult: {
			control: false,
			defaultValue: {
				component: LessonTaskPairedReadingOneContent,
				content: [['Máma', 'mele', 'maso.']]
			}
		}
	},
	parameters: {
		docs: {
			description: {
				component: 'You will start the fake gaze input by clicking on the document.'
			}
		}
	}
} satisfies Meta<LessonFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		gazeInteractionObjectFixation: gazeFixationEmitter,
		lessonConfigResult: {
			component: LessonTaskPairedReadingOneContent,
			content: [
				['Máma', 'mele', 'maso.'],
				['Táta', 'mele', 'maso.']
			],
			gazeInteractionObjectFixation: gazeFixationEmitter
		}
	}
};
