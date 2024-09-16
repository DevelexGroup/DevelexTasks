<script lang="ts">
	import LessonWord from './LessonWord.svelte';
	import { createEventDispatcher } from 'svelte';

	export let word: string;
	export let id: string;
	export let registerElement: (element: HTMLElement) => void;
	export let unregisterElement: (element: HTMLElement) => void;
	export let disabled: boolean = false;
	export let isHighlighted: boolean = false;

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

<button
	class="group relative inline-block {disabled ? '' : 'cursor-pointer'}"
	on:click={handleWordClick}
	{disabled}
>
	<LessonWord {registerElement} {unregisterElement} {word} {id} {isHighlighted} />
	<div
		class="syllable-select absolute -left-2 top-0 -z-10 h-full rounded-md duration-500 {disabled
			? ''
			: 'group-hover:bg-neutral-200 group-hover:opacity-50'}"
	/>
</button>

<style>
	.syllable-select {
		width: calc(100% + 1rem);
	}
</style>
