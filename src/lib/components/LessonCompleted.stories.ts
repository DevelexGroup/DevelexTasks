import type { Meta, StoryObj } from '@storybook/svelte';
import LessonCompleted from './LessonCompleted.svelte';

const meta = {
	title: 'Lesson/LessonCompleted',
	component: LessonCompleted,
	tags: ['autodocs']
} satisfies Meta<LessonCompleted>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
