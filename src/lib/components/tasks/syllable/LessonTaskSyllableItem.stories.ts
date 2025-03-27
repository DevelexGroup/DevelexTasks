import type { Meta, StoryObj } from '@storybook/svelte';
import LessonTaskSyllableItem from './LessonTaskSyllableItem.svelte';

const meta = {
	title: 'Lesson/LessonTaskSyllableItem',
	component: LessonTaskSyllableItem,
	tags: ['autodocs']
} satisfies Meta<LessonTaskSyllableItem>;

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
		word: 'hello',
		id: 'word1',
		registerElement,
		unregisterElement
	}
};
