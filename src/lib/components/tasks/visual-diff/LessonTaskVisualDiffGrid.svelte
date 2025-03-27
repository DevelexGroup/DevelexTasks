<script lang="ts">
	import type { CibuleTaskType } from '$lib/types/lesson';
	import { createEventDispatcher } from 'svelte';
	import LessonTaskVisualDiffLine from './LessonTaskVisualDiffLine.svelte';

	interface Props {
		/**
		 * The content of the task.
		 */
		content?: CibuleTaskType;
		/**
		 * The index of the current row.
		 */
		currentRowIndex?: number;
		/**
		 * Hide assignment syllables for some rows.
		 * Array of row indices to hide the assignment syllable for.
		 */
		hideAssignmentSyllables?: number[];
		/**
		 * Is assignment syllable visible? Sometimes, assignment syllable is not visible for the whole task.
		 * E.g. when it is only read aloud.
		 * It cannot change during the task as this messes up the layout.
		 */
		isSyllableAssignmentPresent?: boolean;
		/**
		 * Width of the assignment syllable gap in pixels.
		 */
		assignmentGap?: number;
		/**
		 * The gap between the syllables in pixels.
		 */
		syllableGap?: number;
		markWantedSyllables?: boolean;
		gridCols?: number;
		/**
		 * Register an element for gaze interaction.
		 * Assuming all syllables needs the same interaction.
		 */
		registerElement: (element: HTMLElement) => void;
		/**
		 * Unregister an element for gaze interaction.
		 */
		unregisterElement: (element: HTMLElement) => void;
	}

	let {
		content = [
			{
				syllables: ['pa', 'ra', 'pa', 'ga'],
				correctSyllable: 'pa'
			},
			{
				syllables: ['ta', 'ra', 'pa', 'ga'],
				correctSyllable: 'ra'
			}
		],
		currentRowIndex = 0,
		hideAssignmentSyllables = [1],
		isSyllableAssignmentPresent = true,
		assignmentGap = 120,
		syllableGap = 12,
		gridCols = 0,
		markWantedSyllables = false,
		registerElement,
		unregisterElement
	}: Props = $props();

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
	{#if content}
		{#each content as task, rowIndex}
			{@const idCorrectSyllable = `visdiff-assignement_${rowIndex}`}
			{@const idOtherSyllableBase = `visdiff-choice_${rowIndex}_`}
			<LessonTaskVisualDiffLine
				content={task}
				{registerElement}
				{unregisterElement}
				{syllableGap}
				{gridCols}
				{idCorrectSyllable}
				{idOtherSyllableBase}
				isSyllableAssignmentVisible={!hideAssignmentSyllables.includes(rowIndex)}
				{isSyllableAssignmentPresent}
				{rowIndex}
				{markWantedSyllables}
				on:correct-syllable-clicked={handleCorrectSyllableClicked}
				on:incorrect-syllable-clicked={handleIncorrectSyllableClicked}
			/>
		{/each}
	{/if}
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
