<script lang="ts">
	import { fade } from 'svelte/transition';
	import LessonCross from './LessonCross.svelte';
	import type { GazeInteractionObjectSetFixation } from '@473783/develex-core';
	import { derived, get, writable } from 'svelte/store';
	import { createEventDispatcher } from 'svelte';
	import LessonWord from './LessonWord.svelte';

	export let gazeFixationEmitter: GazeInteractionObjectSetFixation;
	export let currentContent: string[];

	const FIXATION_WORD = 'fixation-word';
	const FIXATION_EYE = 'fixation-eye';

	const dispatch = createEventDispatcher<{
		lessonSuccess: void;
		lessonMistake: void;
		lessonComplete: void;
	}>();

	const sentenceWordIndex = writable(0);
	const sentenceWordComplete = derived(
		sentenceWordIndex,
		($sentenceWordIndex) => $sentenceWordIndex >= currentContent.length - 1
	);
	const nextSentenceWord = (): boolean => {
		if (get(sentenceWordComplete)) {
			dispatch('lessonSuccess');
			return true;
		}

		sentenceWordIndex.update((n) => n + 1);

		return false;
	};

	let validateFixation: boolean = true;

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
		console.log(target);

		if (!Array.isArray(target) || target.length <= 0) {
			return;
		}

		if (target.some((t) => t.id === FIXATION_EYE)) {
			validateFixation = false;
			return;
		}

		if (target.some((t) => t.id === `${FIXATION_WORD}-${$sentenceWordIndex}`)) {
			if (validateFixation) return;
			nextSentenceWord();
		}
	});

	const inOptions = { duration: 750, delay: 200 };
	const outOptions = { duration: 200 };
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
			class="flex w-screen max-w-7xl items-center justify-center space-x-0.5"
		>
			{#each currentContent as word, index}
				<LessonWord
					id={`${FIXATION_WORD}-${index}`}
					{registerElement}
					{unregisterElement}
					{word}
					isHighlighted={index === $sentenceWordIndex}
				/>
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
