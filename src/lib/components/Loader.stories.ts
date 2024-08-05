import type { Meta, StoryObj } from '@storybook/svelte';
import Loader from './Loader.svelte';

const meta = {
	title: 'Example/Loader',
	component: Loader,
	tags: ['autodocs']
} satisfies Meta<Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
