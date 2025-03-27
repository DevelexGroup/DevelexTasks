import type { Meta, StoryObj } from '@storybook/svelte';
import LessonTaskSyllableLine from './LessonTaskSyllableLine.svelte';

const meta = {
	title: 'Lesson/LessonTaskSyllableLine',
	component: LessonTaskSyllableLine,
	tags: ['autodocs']
} satisfies Meta<LessonTaskSyllableLine>;

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
