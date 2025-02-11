<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { fade } from 'svelte/transition';

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
		extendLeft?: number;
		extendRight?: number;
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
		highlightColor = '#6C7A0E80',
		deHighlightedColor = '#000',
		extendLeft = 3,
		extendRight = 3,
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
	class="relative z-20 inline-flex h-24 items-center justify-center rounded-md"
>
	{#if isHighlighted}
		<div
			class="z-1 pointer-events-none absolute h-full rounded-md"
			style="background-color: {highlightColor}; 
				   left: -{extendLeft}px; 
				   right: -{extendRight}px;"
			in:fade={{ duration: 300 }}
			out:fade={{ duration: 150 }}
		/>
	{/if}
	<span
		class="z-20"
		style="font-size: {size}px; font-family: {font === 'times'
			? 'Times New Roman'
			: 'Arial'}; color: {isDeHighlighted ? deHighlightedColor : textColor};">{word}</span
	>
</div>
