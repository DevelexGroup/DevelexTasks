<script lang="ts">
	import type { SyllableTaskType } from '$lib/types/lesson';
	import LessonTaskSyllableLine from './LessonTaskSyllableLine.svelte';
	import { createEventDispatcher } from 'svelte';

	/**
	 * The content of the task.
	 */
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

	/**
	 * The index of the current row.
	 */
	export let currentRowIndex: number = 0;

	/**
	 * Hide assignment syllables for some rows.
	 * Array of row indices to hide the assignment syllable for.
	 */
	export let hideAssignmentSyllables: number[] = [1];

	/**
	 * Is assignment syllable visible? Sometimes, assignment syllable is not visible for the whole task.
	 * E.g. when it is only read aloud.
	 * It cannot change during the task as this messes up the layout.
	 */
	export let isSyllableAssignmentPresent: boolean = true;

	/**
	 * Width of the assignment syllable gap in pixels.
	 */
	export let assignmentGap: number = 120;

	/**
	 * The gap between the syllables in pixels.
	 */
	export let syllableGap: number = 12;

	/**
	 * Register an element for gaze interaction.
	 * Assuming all syllables needs the same interaction.
	 */
	export let registerElement: (element: HTMLElement) => void;

	/**
	 * Unregister an element for gaze interaction.
	 */
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
		dispatch('incorrect-syllable-clicked', { ...e.detail, currentRowIndex });
	};

	const handleCorrectSyllableClicked = (
		e: CustomEvent<{ word: string; id: string; rowIndex: number }>
	) => {
		const isCorrectRow = e.detail.rowIndex === currentRowIndex;
		if (isCorrectRow) {
			dispatch('correct-syllable-clicked', { ...e.detail, currentRowIndex });
		} else {
			handleIncorrectSyllableClicked(e);
		}
	};
</script>

<div
	class="custom-grid"
	class:one-column={!isSyllableAssignmentPresent}
	style="gap: 1rem {assignmentGap}px;"
>
	{#each content as task, rowIndex}
		{@const idCorrectSyllable = `syllable-assignement_${rowIndex}`}
		{@const idOtherSyllableBase = `syllable-choice_${rowIndex}_`}
		<LessonTaskSyllableLine
			content={task}
			{registerElement}
			{unregisterElement}
			{syllableGap}
			{idCorrectSyllable}
			{idOtherSyllableBase}
			isSyllableAssignmentVisible={!hideAssignmentSyllables.includes(rowIndex)}
			{isSyllableAssignmentPresent}
			{rowIndex}
			on:correct-syllable-clicked={handleCorrectSyllableClicked}
			on:incorrect-syllable-clicked={handleIncorrectSyllableClicked}
		/>
	{/each}
</div>

<style>
	.custom-grid {
		display: grid;
		grid-template-columns: fit-content(100%) 1fr;
	}
	.one-column {
		grid-template-columns: 1fr;
	}
</style>
