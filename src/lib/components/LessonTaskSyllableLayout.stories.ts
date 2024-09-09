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

export const WithInitialSyllable: Story = {
	args: {
		isCrossfixVisible: false,
		isSyllableVisible: true
	}
};

export const WithoutInitialSyllable: Story = {
	args: {
		isCrossfixVisible: false,
		isSyllableVisible: false
	}
};
