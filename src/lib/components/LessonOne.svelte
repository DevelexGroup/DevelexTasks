<script lang="ts">
	import { FIXATION_EYE, sentences, sentence, sentenceComplete } from '$lib/stores/level';
	import { fade } from 'svelte/transition';
	import LessonZeroCompleted from './LessonZeroCompleted.svelte';
	import LessonCross from './LessonCross.svelte';
	import LessonOneWord from './LessonOneWord.svelte';
	import LessonOneCompleted from './LessonOneCompleted.svelte';

	export let validateFixation: Boolean;
	export let registerElement: (element: HTMLElement) => void;
	export let unregisterElement: (element: HTMLElement) => void;

	const inOptions = { duration: 750, delay: 200 };
	const outOptions = { duration: 200 };
</script>

<div class="lesson-stack flex w-full max-w-7xl items-center justify-center">
	{#if $sentenceComplete}
		<LessonOneCompleted />
	{:else if validateFixation}
		<div
			in:fade={inOptions}
			out:fade={outOptions}
			class="flex w-screen max-w-7xl items-center justify-start"
		>
			<LessonCross {registerElement} {unregisterElement} id={FIXATION_EYE} />
		</div>
	{:else}
		<div
			in:fade={inOptions}
			out:fade={outOptions}
			class="flex w-screen max-w-7xl items-center justify-center space-x-4"
		>
			{#each sentences[$sentence] as word, index}
				<LessonOneWord {registerElement} {unregisterElement} {index} {word} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.lesson-stack {
		display: grid;
	}

	.lesson-stack > * {
		grid-area: 1 / 1;
	}
</style>
