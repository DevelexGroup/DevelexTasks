import type { Meta, StoryObj } from '@storybook/svelte';
import LessonWord from './LessonWord.svelte';

const meta = {
	title: 'Lesson/LessonWord',
	component: LessonWord,
	tags: ['autodocs']
} satisfies Meta<LessonWord>;

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
