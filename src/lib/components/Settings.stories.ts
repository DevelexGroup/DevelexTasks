import type { Meta, StoryObj } from '@storybook/svelte';
import Settings from './Settings.svelte';

const meta = {
	title: 'Settings/Settings',
	component: Settings,
	tags: ['autodocs']
} satisfies Meta<Settings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
