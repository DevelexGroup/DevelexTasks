<script lang="ts">
	import Icon from '@iconify/svelte';

	interface Props {
		label?: string;
		onclick: () => void;
	}

	let { label = 'Zpět', onclick }: Props = $props();
</script>

<div>
	<button
		class="inline-flex cursor-pointer items-center space-x-3 rounded-md bg-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-400"
		{onclick}
	>
		<Icon icon="mdi:arrow-left" class="h-5 w-5" />

		<span>{label}</span>
	</button>
</div>
