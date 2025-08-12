<script lang="ts">
	import { resolveAny } from '$lib/utils/resolveAny';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';

	interface Props {
		words: string[];
		id: string;
		registerElement: (element: HTMLElement) => void;
		unregisterElement: (element: HTMLElement) => void;
		disabled?: boolean;
	}

	let { words, id, registerElement, unregisterElement, disabled = false }: Props = $props();

	const dispatch = createEventDispatcher<{
		'word-clicked': {
			word: string;
			id: string;
		};
	}>();

	const handleWordClick = () => {
		dispatch('word-clicked', { word: words[0], id });
	};

	let element = $state<HTMLElement>();

	onMount(() => {
		element && registerElement(element);
	});

	onDestroy(() => {
		element && unregisterElement(element);
	});
</script>

<button
	bind:this={element}
	class="group relative inline-block {disabled ? '' : 'cursor-pointer'}"
	onclick={handleWordClick}
	{disabled}
>
	{#each words as word}
		<div
			{id}
			class="inline-flex h-24 items-center justify-center rounded-md border px-1.5 font-serif text-[30px]"
		>
			<div class="h-20 w-20">
				<img
					src={resolveAny(`/img/lesson/VisualDiff/${word}.png`)}
					alt={word}
					class="h-full w-full"
				/>
			</div>
		</div>
	{/each}

	<div
		class="syllable-select absolute -left-2 top-0 -z-10 h-full rounded-md duration-500 {disabled
			? ''
			: 'group-hover:bg-neutral-200 group-hover:opacity-50'}"
	></div>
</button>

<style>
	.syllable-select {
		width: calc(100% + 1rem);
	}
</style>
