import type { Meta, StoryObj } from '@storybook/svelte';
import SettingsGazeInput from './SettingsGazeInput.svelte';

const meta = {
	title: 'Settings/SettingsGazeInput',
	component: SettingsGazeInput,
	tags: ['autodocs']
} satisfies Meta<SettingsGazeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
