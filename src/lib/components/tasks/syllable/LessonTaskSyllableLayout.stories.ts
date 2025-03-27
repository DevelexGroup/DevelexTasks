import type { Meta, StoryObj } from '@storybook/svelte';
import LessonTaskSyllableLayout from './LessonTaskSyllableLayout.svelte';

const meta = {
	title: 'Lesson/LessonTaskSyllableLayout',
	component: LessonTaskSyllableLayout,
	tags: ['autodocs']
} satisfies Meta<LessonTaskSyllableLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InitialState: Story = {
	args: {}
};
