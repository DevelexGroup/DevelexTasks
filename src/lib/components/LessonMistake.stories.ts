import type { Meta, StoryObj } from '@storybook/svelte';
import LessonMistake from './LessonMistake.svelte';

const meta = {
	title: 'Lesson/LessonMistake',
	component: LessonMistake,
	tags: ['autodocs']
} satisfies Meta<LessonMistake>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
