<script lang="ts">
	import LessonWord from './LessonWord.svelte';
	import { createEventDispatcher } from 'svelte';

	export let word: string;
	export let id: string;
	export let registerElement: (element: HTMLElement) => void;
	export let unregisterElement: (element: HTMLElement) => void;

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

<button class="group relative inline-block cursor-pointer" on:click={handleWordClick}>
	<LessonWord {registerElement} {unregisterElement} {word} {id} isHighlighted={false} />
	<div
		class="absolute left-0 top-0 -z-10 h-full w-full rounded-md duration-500 group-hover:bg-neutral-200 group-hover:opacity-50"
	></div>
</button>
