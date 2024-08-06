<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	export let isHighlighted: boolean = false;
	export let word: string;
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
	{id}
	bind:this={element}
	class="inline-flex h-24 items-center justify-center rounded-md text-[32px] {isHighlighted
		? 'text-green-700'
		: 'text-gray-700'}"
>
	{word}
</div>
