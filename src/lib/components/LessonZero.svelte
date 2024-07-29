<script lang="ts">
	import { FIXATION_EYE, FIXATION_WORD, zeroLevelComplete } from '$lib/stores/level';
	import { fade } from 'svelte/transition';
	import LessonZeroCompleted from './LessonZeroCompleted.svelte';
	import LessonZeroWord from './LessonZeroWord.svelte';
	import LessonCross from './LessonCross.svelte';

	export let validateFixation: Boolean;
	export let registerElement: (element: HTMLElement) => void;
	export let unregisterElement: (element: HTMLElement) => void;

	const inOptions = { duration: 750, delay: 200 };
	const outOptions = { duration: 200 };
</script>

<div class="lesson-stack flex w-full max-w-7xl items-center justify-center">
	{#if $zeroLevelComplete}
		<LessonZeroCompleted />
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
			class="flex w-screen max-w-7xl items-center justify-center"
		>
			<LessonZeroWord {registerElement} {unregisterElement} id={FIXATION_WORD} />
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
