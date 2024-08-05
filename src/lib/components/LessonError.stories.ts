import type { Meta, StoryObj } from '@storybook/svelte';
import LessonError from './LessonError.svelte';

const meta = {
	title: 'Lesson/LessonError',
	component: LessonError,
	tags: ['autodocs']
} satisfies Meta<LessonError>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		errorMessages: ['Error message 1', 'Error message 2']
	}
};
