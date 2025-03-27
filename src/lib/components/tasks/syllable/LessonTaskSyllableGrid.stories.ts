import type { Meta, StoryObj } from '@storybook/svelte';
import LessonTaskSyllableGrid from './LessonTaskSyllableGrid.svelte';

const meta = {
	title: 'Lesson/LessonTaskSyllableGrid',
	component: LessonTaskSyllableGrid,
	tags: ['autodocs'],
	argTypes: {
		hideAssignmentSyllables: {
			options: [[0], [1], [], [0, 1]],
			control: { type: 'radio' }
		}
	}
} satisfies Meta<LessonTaskSyllableGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const registerElement = (element: HTMLElement) => {
	element.addEventListener('click', () => {
		console.log('Element clicked:', element);
	});
};

const unregisterElement = (element: HTMLElement) => {
	element.removeEventListener('click', () => {
		console.log('Element clicked:', element);
	});
};

export const Default: Story = {
	args: {
		registerElement,
		unregisterElement
	}
};
