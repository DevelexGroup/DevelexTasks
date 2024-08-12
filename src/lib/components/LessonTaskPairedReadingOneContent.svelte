<script lang="ts">
	import LessonCross from './LessonCross.svelte';
	import type {
		GazeInteractionObjectSetFixation,
		GazeInteractionObjectSetFixationEvent
	} from '@473783/develex-core';
	import { get, writable } from 'svelte/store';
	import { createEventDispatcher, onDestroy } from 'svelte';
	import LessonWord from './LessonWord.svelte';
	import LessonLayoutPairedReading from './LessonLayoutPairedReading.svelte';

	/**
	 * TODO: THIS IS OLD CODE AND SHOULD BE REMADE ACCORDING TO THE OTHER PAIRED READINGS
	 * i.e. it should use async functions and the new event system
	 */

	export let gazeFixationEmitter: GazeInteractionObjectSetFixation;
	export let currentContent: string[];

	const FIXATION_WORD = 'fixation-word';
	const FIXATION_EYE = 'fixation-eye';

	const dispatch = createEventDispatcher<{
		lessonSuccess: void;
		lessonMistake: void;
		lessonComplete: void;
		lessonFail: void;
	}>();

	const sentenceWordIndex = writable(0);
	const nextSentenceWord = (): boolean => {
		const isLastWord = get(sentenceWordIndex) >= currentContent.length - 1;
		if (isLastWord) {
			dispatch('lessonComplete');
			gazeFixationEmitter.off('fixationSetEnd', onFixationSetEnd);
			return true;
		}

		sentenceWordIndex.update((n) => n + 1);

		return false;
	};

	let validateFixation: boolean = true;

	const registerElement = (element: HTMLElement) => {
		gazeFixationEmitter.register(element, {
			bufferSize: 150
		});
	};

	const unregisterElement = (element: HTMLElement) => {
		gazeFixationEmitter.unregister(element);
	};

	const onFixationSetEnd = (event: GazeInteractionObjectSetFixationEvent) => {
		const { target } = event;

		if (!Array.isArray(target) || target.length <= 0) {
			return;
		}

		if (target.some((t) => t.id === FIXATION_EYE)) {
			validateFixation = false;
			dispatch('lessonSuccess');
			return;
		}

		if (target.some((t) => t.id === `${FIXATION_WORD}-${$sentenceWordIndex}`)) {
			if (validateFixation) return;
			nextSentenceWord();
		}
	};

	gazeFixationEmitter.on('fixationSetEnd', onFixationSetEnd);

	onDestroy(() => {
		gazeFixationEmitter.off('fixationSetEnd', onFixationSetEnd);
	});
</script>

<LessonLayoutPairedReading {validateFixation}>
	<LessonCross {registerElement} {unregisterElement} id={FIXATION_EYE} slot="cross-fix" />
	<svelte:fragment slot="word-area">
		{#each currentContent as word, index}
			<LessonWord
				id={`${FIXATION_WORD}-${index}`}
				{registerElement}
				{unregisterElement}
				{word}
				isHighlighted={index === $sentenceWordIndex}
			/>
		{/each}
	</svelte:fragment>
</LessonLayoutPairedReading>
