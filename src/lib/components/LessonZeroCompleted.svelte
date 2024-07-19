<script lang="ts">
	import { nextLevel } from '$lib/stores/level';
	import Icon from '@iconify/svelte';
	import { fade } from 'svelte/transition';

	const onClick = () => {
		nextLevel();
	};
</script>

<div
	in:fade={{ duration: 250 }}
	class="flex w-screen max-w-7xl flex-col items-center justify-center gap-4"
>
	<h1 class="text-3xl text-gray-700">Zero Level Complete</h1>

	<div
		class="inline-flex h-14 w-14 items-center justify-center rounded-full border border-green-200 bg-gray-100"
	>
		<Icon icon="material-symbols:thumb-up-outline-rounded" class="h-8 w-8 text-green-500" />
	</div>

	<p class="text-lg text-gray-700">You have completed the zero level.</p>

	<button
		class="rounded-md bg-blue-600 px-4 py-2 font-semibold uppercase text-gray-50"
		on:click={onClick}
	>
		Next level
	</button>
</div>
