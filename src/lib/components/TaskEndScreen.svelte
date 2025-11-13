<script lang="ts">
	import Icon from '@iconify/svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
</script>

<div
	in:fade={{ duration: 250 }}
	class="flex h-screen w-full flex-col items-center justify-center gap-4"
>
	<h1 class="text-3xl font-bold text-neutral-600">Lekce úspěšně dokončena!</h1>

	<div
		class="inline-flex h-14 w-14 items-center justify-center rounded-full border border-green-200 bg-gray-100"
	>
		<Icon icon="material-symbols:thumb-up-outline-rounded" class="h-8 w-8 text-green-500" />
	</div>

	<button
		class="rounded-md bg-blue-500 px-3 py-1.5 text-gray-50 hover:bg-blue-600"
		onclick={() => goto(resolve(`/`))}
	>
		Zpátky na výběr lekcí
	</button>
</div>