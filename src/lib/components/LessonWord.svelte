<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	interface Props {
		isHighlighted?: boolean;
		isDeHighlighted?: boolean;
		word: string;
		id: string;
		size?: number;
		font?: 'times' | 'arial';
		textColor?: string;
		highlightColor?: string;
		deHighlightedColor?: string;
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
		textColor = '#000',
		highlightColor = '#6C7A0ECC',
		deHighlightedColor = '#9CA3AF',
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
	class="inline-flex h-24 items-center justify-center rounded-md"
	style="font-size: {size}px; font-family: {font === 'times'
		? 'Times New Roman'
		: 'Arial'}; color: {isHighlighted
		? highlightColor
		: isDeHighlighted
			? deHighlightedColor
			: textColor};"
>
	{word}
</div>
