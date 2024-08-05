import type { Meta, StoryObj } from '@storybook/svelte';
import Lesson from './Lesson.svelte';
import {
	createGazeInput,
	GazeInteractionObjectSetFixation,
	GazeInteractionScreenFixation
} from '@473783/develex-core';
import LessonTaskPairedReadingOneContent from './LessonTaskPairedReadingOneContent.svelte';
import type { LessonConfig } from '$lib/types/lesson';

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

// it resolves on click in document
const lessonConfig: Promise<LessonConfig> = new Promise((resolve) => {
	document.addEventListener(
		'click',
		(e) => {
			mouseGazeInput.setWindowCalibration(e, window);
			mouseGazeInput.connect();
			mouseGazeInput.start();
			resolve({
				component: LessonTaskPairedReadingOneContent,
				content: [
					['Máma', 'mele', 'maso.'],
					['Teta', 'táta', 'teta.']
				],
				gazeInteractionObjectSetFixation: gazeFixationEmitter
			});
		},
		{ once: true }
	);
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
