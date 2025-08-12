<script lang="ts">
	import Icon from '@iconify/svelte';
	import { fade } from 'svelte/transition';
	import Button from './Button.svelte';
	import { resolveAny } from '$lib/utils/resolveAny';
</script>

<div
	in:fade={{ duration: 250 }}
	class="flex h-full w-full flex-col items-center justify-center gap-4 bg-neutral-50"
>
	<h1 class="text-3xl font-bold text-neutral-600">Lekce úspěšně dokončena!</h1>

	<div
		class="inline-flex h-14 w-14 items-center justify-center rounded-full border border-green-200 bg-gray-100"
	>
		<Icon icon="material-symbols:thumb-up-outline-rounded" class="h-8 w-8 text-green-500" />
	</div>

	<Button href={resolveAny('/')}>Zpátky na výběr lekcí</Button>
</div>
