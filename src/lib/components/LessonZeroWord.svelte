<script lang="ts">
	import { words, zeroLevelProgress } from '$lib/stores/level';
	import { onDestroy, onMount } from 'svelte';

	export let id: string;
	export let registerElement: (element: HTMLElement) => void;
	export let unregisterElement: (element: HTMLElement) => void;

	let element: HTMLElement;

	onMount(() => {
		registerElement(element);
	});

	onDestroy(() => {
		unregisterElement(element);
	});
</script>

<div
	bind:this={element}
	{id}
	class="inline-flex h-20 w-48 items-center justify-center rounded-md border border-gray-100 bg-gray-50 text-3xl text-gray-700"
>
	{words[$zeroLevelProgress]}
</div>
