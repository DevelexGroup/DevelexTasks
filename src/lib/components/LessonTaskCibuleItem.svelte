<script lang="ts">
	import LessonWordLight from './LessonWordLight.svelte';
	import { createEventDispatcher } from 'svelte';

	interface Props {
		word: string;
		id: string;
		registerElement: (element: HTMLElement) => void;
		unregisterElement: (element: HTMLElement) => void;
		disabled?: boolean;
		isHighlighted?: boolean;
		isWrong?: boolean;
	}

	let {
		word,
		id,
		registerElement,
		unregisterElement,
		disabled = false,
		isHighlighted = false,
		isWrong = false
	}: Props = $props();

	const dispatch = createEventDispatcher<{
		'word-clicked': {
			word: string;
			id: string;
		};
	}>();

	const handleWordClick = () => {
		dispatch('word-clicked', { word, id });
	};
</script>

{#if isWrong}
	{#each word.split('') as char}
		<button
			class="group relative inline-block {disabled ? '' : 'cursor-pointer'}"
			onclick={handleWordClick}
			{disabled}
		>
			<LessonWordLight {registerElement} {unregisterElement} word={char} {id} {isHighlighted} />
			<div
				class="syllable-select absolute -left-2 top-0 -z-10 h-full rounded-md duration-500 {disabled
					? ''
					: 'group-hover:bg-neutral-200 group-hover:opacity-50'}"
			></div>
		</button>
	{/each}
{:else}
	<button
		class="group relative inline-block {disabled ? '' : 'cursor-pointer'}"
		onclick={handleWordClick}
		{disabled}
	>
		<LessonWordLight {registerElement} {unregisterElement} {word} {id} {isHighlighted} />
		<div
			class="syllable-select absolute -left-2 top-0 -z-10 h-full rounded-md duration-500 {disabled
				? ''
				: 'group-hover:bg-neutral-200 group-hover:opacity-50'}"
		></div>
	</button>
{/if}

<style>
	.syllable-select {
		width: calc(100% + 1rem);
	}
</style>
