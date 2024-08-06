import type { Meta, StoryObj } from '@storybook/svelte';
import LessonFail from './LessonFail.svelte';

const meta = {
	title: 'Lesson/LessonFail',
	component: LessonFail,
	tags: ['autodocs']
} satisfies Meta<LessonFail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
