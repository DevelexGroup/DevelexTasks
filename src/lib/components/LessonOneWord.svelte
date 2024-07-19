<script lang="ts">
	import { FIXATION_WORD, sentenceWord } from '$lib/stores/level';
	import { onDestroy, onMount } from 'svelte';

	export let index: number;
	export let word: string;
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
	id={`${FIXATION_WORD}-${index}`}
	bind:this={element}
	class="inline-flex h-20 w-48 items-center justify-center rounded-md border border-gray-100 bg-gray-50 text-3xl {$sentenceWord ==
	index
		? 'text-red-500'
		: 'text-gray-700'}"
>
	{word}
</div>
