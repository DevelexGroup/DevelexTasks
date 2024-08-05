<script lang="ts">
	import { fade } from 'svelte/transition';
	import LessonCross from './LessonCross.svelte';
	import { createEventDispatcher } from 'svelte';
	import type { GazeInteractionObjectSetFixation } from '@473783/develex-core';
	import LessonWord from './LessonWord.svelte';

	export let gazeFixationEmitter: GazeInteractionObjectSetFixation;
	export let currentContent: string;

	const FIXATION_EYE = 'fixation-eye';
	const FIXATION_WORD = 'fixation-word';
	const inOptions = { duration: 750, delay: 200 };
	const outOptions = { duration: 200 };

	let validateFixation = true;

	const registerElement = (element: HTMLElement) => {
		gazeFixationEmitter.register(element, {
			bufferSize: 25
		});
	};

	const unregisterElement = (element: HTMLElement) => {
		gazeFixationEmitter.unregister(element);
	};

	gazeFixationEmitter.on('fixationSetEnd', (event) => {
		const { target } = event;

		if (!Array.isArray(target) || target.length <= 0) {
			return;
		}

		if (target.some((t) => t.id === FIXATION_EYE)) {
			validateFixation = false;
			return;
		}

		if (target.some((t) => t.id === FIXATION_WORD)) {
			if (validateFixation) return;
			validateFixation = true;
			nextZeroLevel();
		}
	});

	const dispatch = createEventDispatcher<{
		lessonSuccess: void;
		lessonMistake: void;
		lessonComplete: void;
	}>();

	const nextZeroLevel = () => {
		setTimeout(() => {
			dispatch('lessonSuccess');
		}, 300);
	};
</script>

<div class="lesson-stack flex w-full max-w-7xl items-center justify-center">
	{#if validateFixation}
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
			<LessonWord {registerElement} {unregisterElement} word={currentContent} id={FIXATION_WORD} />
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
