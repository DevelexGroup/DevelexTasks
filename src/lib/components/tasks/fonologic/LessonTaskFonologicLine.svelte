<script lang="ts">
	import type { FonologicTaskType } from '$lib/types/lesson';
	import { fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import LessonTaskFonologicItem from './LessonTaskFonologicItem.svelte';
	import LessonWordLight from '$lib/components/LessonWordLight.svelte';
	import LessonTaskSyllableItem from '../syllable/LessonTaskSyllableItem.svelte';

	interface Props {
		isSyllableAssignmentVisible?: boolean;
		isSyllableAssignmentPresent?: boolean;
		content?: FonologicTaskType[number];
		syllableGap?: number;
		rowIndex?: number;
		registerElement: (element: HTMLElement) => void;
		unregisterElement: (element: HTMLElement) => void;
		idCorrectSyllable?: string;
		idOtherSyllableBase?: string;
	}

	let {
		isSyllableAssignmentVisible = true,
		isSyllableAssignmentPresent = true,
		content = {
			syllables: ['pa', 'ra', 'pa', 'ga'],
			correctSyllable: 'pa'
		},
		syllableGap = 12,
		rowIndex = 0,
		registerElement,
		unregisterElement,
		idCorrectSyllable = 'fonologic-assignement',
		idOtherSyllableBase = 'fonologic-choice-'
	}: Props = $props();

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

	const roundCompleteAudio = new Audio('/sound/positive.wav');
	roundCompleteAudio.volume = 0.4;

	const inOptions = { duration: 750, delay: 200 };
	const outOptions = { duration: 200 };

	let showProgressAfterMistake = $state(false);
	let usedIndexes = $state<number[]>([]);

	const evaluateSyllable = (e: CustomEvent<{ word: string; id: string }>) => {
		showProgressAfterMistake = false;

		const columnIndex = +e.detail.id.replace(`${idOtherSyllableBase}`, '');
		const isCorrect = content.correctIndexes?.includes(columnIndex);

		if (!isCorrect || usedIndexes.includes(columnIndex)) {
			setTimeout(() => {
				showProgressAfterMistake = true;
				setTimeout(() => {
					showProgressAfterMistake = false;
				}, 3500);
			}, 4500);

			dispatch('incorrect-syllable-clicked', { ...e.detail, rowIndex });
			return;
		}

		usedIndexes.push(columnIndex);
		roundCompleteAudio.pause();
		roundCompleteAudio.currentTime = 0;
		roundCompleteAudio.play();

		if (usedIndexes.length == content.correctIndexes?.length) {
			dispatch('correct-syllable-clicked', { ...e.detail, rowIndex });
		}
	};
</script>

{#if isSyllableAssignmentPresent}
	<div class="relative mr-48 flex items-center">
		{#if isSyllableAssignmentVisible && isSyllableAssignmentPresent}
			<div in:fade={inOptions} out:fade={outOptions} class="absolute">
				{#if content.correctImage}
					<LessonTaskFonologicItem
						disabled={true}
						word={content.correctImage}
						id={idCorrectSyllable}
						{registerElement}
						{unregisterElement}
					/>
				{:else if content.correctSyllable}
					<LessonTaskSyllableItem
						disabled={true}
						word={content.correctSyllable}
						id={idCorrectSyllable}
						{registerElement}
						{unregisterElement}
					/>
				{/if}
			</div>
		{/if}
		<!-- Shadow LessonWord without gaze registration to -->
		<div class="pointer-events-none select-none text-red-400 opacity-0">
			<LessonWordLight word={content.correctSyllable ?? ''} id={idCorrectSyllable} />
		</div>
	</div>
{/if}
<div class="flex" style={`gap: ${syllableGap}px;`}>
	{#each content.syllables as syllable, index}
		<LessonTaskFonologicItem
			disabled={false}
			word={syllable}
			id={`${idOtherSyllableBase}${index}`}
			{registerElement}
			{unregisterElement}
			isHighlighted={showProgressAfterMistake && usedIndexes.includes(index)}
			on:word-clicked={evaluateSyllable}
		/>
	{/each}
</div>
