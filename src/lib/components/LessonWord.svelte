<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	interface Props {
		isHighlighted?: boolean;
		isDeHighlighted?: boolean;
		word: string;
		id: string;
		size?: number;
		font?: 'times' | 'arial';
		registerElement?: (element: HTMLElement) => void;
		unregisterElement?: (element: HTMLElement) => void;
	}

	let {
		isHighlighted = false,
		isDeHighlighted = false,
		word,
		id,
		size = 30,
		font = 'times',
		registerElement = () => {},
		unregisterElement = () => {}
	}: Props = $props();

	let element: HTMLElement | undefined = $state();

	onMount(() => {
		if (element) {
			registerElement(element);
		}
	});

	onDestroy(() => {
		if (element) {
			unregisterElement(element);
		}
	});
</script>

<div
	{id}
	bind:this={element}
	class="inline-flex h-24 items-center justify-center rounded-md {isHighlighted
		? 'text-green-500'
		: isDeHighlighted
			? 'text-gray-400'
			: 'text-gray-700'}"
	style="font-size: {size}px; font-family: {font === 'times' ? 'Times New Roman' : 'Arial'};"
>
	{word}
</div>
