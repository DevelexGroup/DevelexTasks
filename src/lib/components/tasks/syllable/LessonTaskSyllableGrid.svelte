<script lang="ts">
	import type { SyllableTaskType } from '$lib/types/lesson';
	import LessonTaskSyllableLine from './LessonTaskSyllableLine.svelte';

	interface Props {
		/**
		 * The content of the task.
		 */
		content?: SyllableTaskType;
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
		/**
		 * Register an element for gaze interaction.
		 * Assuming all syllables needs the same interaction.
		 */
		registerElement: (element: HTMLElement) => void;
		/**
		 * Unregister an element for gaze interaction.
		 */
		unregisterElement: (element: HTMLElement) => void;
		highlightLine?: boolean;
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
		registerElement,
		unregisterElement,
		highlightLine = false
	}: Props = $props();

	const getCorrectRowIdsForTheCorrect = (syllableRow: SyllableTaskType[number]) => {
		const { correctSyllable, syllables } = syllableRow;
		return syllables
			.map((value, index) => (value === correctSyllable ? index : -1))
			.filter((index) => index !== -1);
	};
</script>

<div
	class="custom-grid"
	class:one-column={!isSyllableAssignmentPresent}
	style="gap: 1rem {assignmentGap}px;"
>
	{#each content as task, rowIndex}
		{@const idAssignementSyllable = `syllable-assignement_${rowIndex}`}
		{@const idOtherSyllableBase = `syllable-choice_${rowIndex}_`}
		{@const correctIdsInTheRow = getCorrectRowIdsForTheCorrect(task)}
		<LessonTaskSyllableLine
			content={task}
			{registerElement}
			{unregisterElement}
			{syllableGap}
			{idAssignementSyllable}
			{idOtherSyllableBase}
			{correctIdsInTheRow}
			isSyllableAssignmentVisible={!hideAssignmentSyllables.includes(rowIndex)}
			{isSyllableAssignmentPresent}
			{rowIndex}
			isActive={currentRowIndex === rowIndex}
			{highlightLine}
			isLast={rowIndex === content.length - 1}
			on:correct-syllable-clicked
			on:all-correct-syllables-clicked
			on:incorrect-syllable-clicked
			on:read-assigment
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
