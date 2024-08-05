import type { Meta, StoryObj } from '@storybook/svelte';
import LessonWaiting from './LessonWaiting.svelte';

const meta = {
	title: 'Lesson/LessonWaiting',
	component: LessonWaiting,
	tags: ['autodocs']
} satisfies Meta<LessonWaiting>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
