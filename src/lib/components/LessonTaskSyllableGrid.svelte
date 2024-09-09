<script lang="ts">
	import type { SyllableTaskType } from '$lib/types/lesson';
	import LessonTaskSyllableLine from './LessonTaskSyllableLine.svelte';
	import { createEventDispatcher } from 'svelte';

	export let content: SyllableTaskType[] = [
		{
			syllables: ['pa', 'ra', 'pa', 'ga'],
			correctSyllable: 'pa'
		},
		{
			syllables: ['ta', 'ra', 'pa', 'ga'],
			correctSyllable: 'ra'
		}
	];

	export let rowIndex: number = 0;

	/**
	 * The gap between the syllables in pixels.
	 */
	export let syllableGap: number = 12;

	export let registerElement: (element: HTMLElement) => void;
	export let unregisterElement: (element: HTMLElement) => void;

	const dispatch = createEventDispatcher<{
		'correct-syllable-clicked': {
			word: string;
			id: string;
			rowIndex: number;
			currentRowIndex: number;
		};
		'incorrect-syllable-clicked': {
			word: string;
			id: string;
			rowIndex: number;
			currentRowIndex: number;
		};
	}>();

	const handleIncorrectSyllableClicked = (
		e: CustomEvent<{ word: string; id: string; rowIndex: number }>
	) => {
		const currentRowIndex = rowIndex;
		dispatch('incorrect-syllable-clicked', { ...e.detail, currentRowIndex });
	};

	const handleCorrectSyllableClicked = (
		e: CustomEvent<{ word: string; id: string; rowIndex: number }>
	) => {
		const isCorrectRow = e.detail.rowIndex === rowIndex;
		if (isCorrectRow) {
			dispatch('correct-syllable-clicked', { ...e.detail, currentRowIndex: rowIndex });
		} else {
			handleIncorrectSyllableClicked(e);
		}
	};
</script>

<div class="custom-grid">
	{#each content as task, i}
		{@const idCorrectSyllable = `syllable-assignement_${i}`}
		{@const idOtherSyllableBase = `syllable-choice_${i}_`}
		<LessonTaskSyllableLine
			content={task}
			{registerElement}
			{unregisterElement}
			{syllableGap}
			{idCorrectSyllable}
			{idOtherSyllableBase}
			on:correct-syllable-clicked={handleCorrectSyllableClicked}
			on:incorrect-syllable-clicked={handleIncorrectSyllableClicked}
		/>
	{/each}
</div>

<style>
	.custom-grid {
		display: grid;
		grid-template-columns: fit-content(100%) 1fr;
		gap: 1rem 4rem;
	}
</style>
