<script lang="ts">
	import type { SyllableTaskType } from '$lib/types/lesson';
	import { fade } from 'svelte/transition';
	import LessonTaskSyllableItem from './LessonTaskSyllableItem.svelte';
	import { createEventDispatcher } from 'svelte';
	import LessonWord from './LessonWord.svelte';

	/**
	 * Is assignment syllable visible?
	 * It can change during the task or it might be invisible from the start.
	 */
	export let isSyllableAssignmentVisible: boolean = true;

	/**
	 * Is syllable assignment present? If not, no space is reserved for it.
	 * This should not be changed during the task as this messes up the layout.
	 */
	export let isSyllableAssignmentPresent: boolean = true;

	export let content: SyllableTaskType[number] = {
		syllables: ['pa', 'ra', 'pa', 'ga'],
		correctSyllable: 'pa'
	};

	/**
	 * The gap between the syllables in pixels.
	 */
	export let syllableGap: number = 12;

	export let rowIndex: number = 0;

	export let registerElement: (element: HTMLElement) => void;
	export let unregisterElement: (element: HTMLElement) => void;
	export let idCorrectSyllable: string = 'syllable-assignement';
	export let idOtherSyllableBase: string = 'syllable-choice-';

	const dispatch = createEventDispatcher<{
		'correct-syllable-clicked': {
			word: string;
			id: string;
			rowIndex: number;
		};
		'incorrect-syllable-clicked': {
			word: string;
			id: string;
			rowIndex: number;
		};
	}>();

	const inOptions = { duration: 750, delay: 200 };
	const outOptions = { duration: 200 };

	const evaluateSyllable = (e: CustomEvent<{ word: string; id: string }>) => {
		const isCorrect = e.detail.word === content.correctSyllable;
		if (isCorrect) {
			dispatch('correct-syllable-clicked', { ...e.detail, rowIndex });
		} else {
			dispatch('incorrect-syllable-clicked', { ...e.detail, rowIndex });
		}
	};
</script>

{#if isSyllableAssignmentPresent}
	<div class="relative">
		{#if isSyllableAssignmentVisible && isSyllableAssignmentPresent && content.correctSyllable}
			<div in:fade={inOptions} out:fade={outOptions} class="absolute">
				<LessonTaskSyllableItem
					disabled={true}
					word={content.correctSyllable}
					id={idCorrectSyllable}
					{registerElement}
					{unregisterElement}
				/>
			</div>
		{/if}
		<!-- Shadow LessonWord without gaze registration to -->
		<div class="pointer-events-none select-none opacity-0">
			<LessonWord word={content.correctSyllable} id={idCorrectSyllable} />
		</div>
	</div>
{/if}
<div class="flex" style="gap: {syllableGap}px;">
	{#each content.syllables as syllable, index}
		<LessonTaskSyllableItem
			disabled={false}
			word={syllable}
			id={`${idOtherSyllableBase}${index}`}
			{registerElement}
			{unregisterElement}
			on:word-clicked={evaluateSyllable}
		/>
	{/each}
</div>
