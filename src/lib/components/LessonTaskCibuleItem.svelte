<script lang="ts">
	import LessonWord from './LessonWord.svelte';
	import { createEventDispatcher } from 'svelte';

	interface Props {
		word: string;
		id: string;
		registerElement: (element: HTMLElement) => void;
		unregisterElement: (element: HTMLElement) => void;
		disabled?: boolean;
		isHighlighted?: boolean;
	}

	let {
		word,
		id,
		registerElement,
		unregisterElement,
		disabled = false,
		isHighlighted = false
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

<button
	class="group relative inline-block {disabled ? '' : 'cursor-pointer'}"
	onclick={handleWordClick}
	{disabled}
>
	<LessonWord {registerElement} {unregisterElement} {word} {id} {isHighlighted} />
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
