import type { Meta, StoryObj } from '@storybook/svelte';
import LessonLoad from './LessonLoad.svelte';

const meta = {
	title: 'Lesson/LessonLoad',
	component: LessonLoad,
	tags: ['autodocs']
} satisfies Meta<LessonLoad>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
