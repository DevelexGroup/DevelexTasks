import type { Meta, StoryObj } from '@storybook/svelte';
import LessonCross from './LessonCross.svelte';

const meta = {
	title: 'Lesson/LessonCross',
	component: LessonCross,
	tags: ['autodocs']
} satisfies Meta<LessonCross>;

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
		id: 'word1',
		registerElement,
		unregisterElement
	}
};
