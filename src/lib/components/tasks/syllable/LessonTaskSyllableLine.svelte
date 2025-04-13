<script lang="ts">
	import type { SyllableTaskType } from '$lib/types/lesson';
	import { fade } from 'svelte/transition';
	import LessonTaskSyllableItem from './LessonTaskSyllableItem.svelte';
	import { createEventDispatcher } from 'svelte';
	import LessonWordLight from '$lib/components/LessonWordLight.svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		/**
		 * Is assignment syllable visible?
		 * It can change during the task or it might be invisible from the start.
		 */
		isSyllableAssignmentVisible?: boolean;
		/**
		 * Is syllable assignment present? If not, no space is reserved for it.
		 * This should not be changed during the task as this messes up the layout.
		 */
		isSyllableAssignmentPresent?: boolean;
		content?: SyllableTaskType[number];
		/**
		 * The gap between the syllables in pixels.
		 */
		correctIdsInTheRow: number[];
		syllableGap?: number;
		rowIndex?: number;
		isActive: boolean;
		registerElement: (element: HTMLElement) => void;
		unregisterElement: (element: HTMLElement) => void;
		idAssignementSyllable?: string;
		idOtherSyllableBase?: string;
		highlightLine?: boolean;
		isLast?: boolean;
	}

	let {
		isSyllableAssignmentVisible = true,
		isSyllableAssignmentPresent = true,
		correctIdsInTheRow,
		isActive,
		content = {
			syllables: ['pa', 'ra', 'pa', 'ga'],
			correctSyllable: 'pa'
		},
		syllableGap = 12,
		rowIndex = 0,
		registerElement,
		unregisterElement,
		idAssignementSyllable = 'syllable-assignement',
		idOtherSyllableBase = 'syllable-choice-',
		highlightLine = false,
		isLast = false
	}: Props = $props();

	const correctIndexes = content.syllables
		.map((item, index) => (item === content.correctSyllable ? index : -1))
		.filter((index) => index !== -1)
		.reverse();

	const getNextExpectingIndex = (): number => {
		return correctIndexes.pop() ?? -1;
	};

	const dispatch = createEventDispatcher<{
		'correct-syllable-clicked': {
			word: string;
			id: string;
			rowIndex: number;
		};
		'all-correct-syllables-clicked': {
			word: string;
			id: string;
			rowIndex: number;
		};
		'incorrect-syllable-clicked': {
			word: string;
			id: string;
			rowIndex: number;
		};
		'read-assigment': {};
	}>();

	const inOptions = { duration: 750, delay: 200 };
	const outOptions = { duration: 200 };

	const getSyllableId = (index: number) => `${idOtherSyllableBase}${index}`;
	const correctIds = new Set(correctIdsInTheRow.map((ix) => getSyllableId(ix)));
	const clickedIds = new Set<string>(); // Track clicked syllables
	let correctExpectingIndex = getNextExpectingIndex();
	const roundCompleteAudio = new Audio('/sound/positive.wav');
	roundCompleteAudio.volume = 0.4;
	let showProgressAfterMistake = $state(false);
	let usedIndexes = $state<number[]>([]);
	let timeout: number | null = null;

	const evaluateSyllable = (e: CustomEvent<{ word: string; id: string }>) => {
		showProgressAfterMistake = false;
		timeout != null && clearTimeout(timeout);

		if (!isActive) {
			mistake(e);
			return;
		}

		const columnIndex = +e.detail.id.replace(`${idOtherSyllableBase}`, '');
		const isCorrect = correctExpectingIndex == columnIndex;

		if (!isCorrect) {
			mistake(e);
			return;
		}

		const currentCorrectIndexes = correctIndexes.length;

		usedIndexes.push(correctExpectingIndex);
		correctExpectingIndex = getNextExpectingIndex();

		dispatch('correct-syllable-clicked', { ...e.detail, rowIndex });

		if (currentCorrectIndexes <= 0) {
			dispatch('all-correct-syllables-clicked', { ...e.detail, rowIndex });
		}

		if (currentCorrectIndexes > 0 || (currentCorrectIndexes <= 0 && !isLast)) {
			roundCompleteAudio.pause();
			roundCompleteAudio.currentTime = 0;
			roundCompleteAudio.play();
		}

		// const { id } = e.detail;
		// if (correctIds.has(id)) {
		// 	clickedIds.add(id); // Add correct ID to clicked set

		// 	// Check if all correct IDs are clicked
		// 	const allCorrectClicked = Array.from(correctIds).every((correctId) =>
		// 		clickedIds.has(correctId)
		// 	);

		// 	dispatch('correct-syllable-clicked', { ...e.detail, rowIndex });
		// 	if (allCorrectClicked) {
		// 		dispatch('all-correct-syllables-clicked', { ...e.detail, rowIndex });
		// 	}
		// } else {
		// 	dispatch('incorrect-syllable-clicked', { ...e.detail, rowIndex });
		// }
	};

	const mistake = (e: CustomEvent<{ word: string; id: string }>) => {
		showProgressAfterMistake = true;
		timeout != null && clearTimeout(timeout);
		timeout = setTimeout(() => {
			showProgressAfterMistake = false;
		}, 3500);

		dispatch('incorrect-syllable-clicked', { ...e.detail, rowIndex });
	};
</script>

{#if isSyllableAssignmentPresent}
	<div class="relative">
		{#if isSyllableAssignmentVisible && isSyllableAssignmentPresent && content.correctSyllable}
			<div in:fade={inOptions} out:fade={outOptions} class="absolute">
				<LessonTaskSyllableItem
					disabled={true}
					word={content.correctSyllable}
					id={idAssignementSyllable}
					{registerElement}
					{unregisterElement}
				/>
			</div>
		{/if}
		<!-- Shadow LessonWord without gaze registration to -->
		<div class="pointer-events-none select-none opacity-0">
			<LessonWordLight word={content.correctSyllable} id={idAssignementSyllable} />
		</div>
	</div>
{/if}
<div class="flex" style="gap: {syllableGap}px;">
	{#if !isSyllableAssignmentPresent}
		<button
			class="mr-12"
			class:invisible={!isActive}
			onclick={() => dispatch('read-assigment', {})}
		>
			<Icon icon="material-symbols:volume-up-outline-rounded" class="h-14 w-14 text-gray-400" />
		</button>
	{/if}

	{#each content.syllables as syllable, index}
		<LessonTaskSyllableItem
			disabled={false}
			word={syllable}
			id={getSyllableId(index)}
			{registerElement}
			{unregisterElement}
			isHighlighted={usedIndexes.includes(index) && showProgressAfterMistake}
			isDeHighlighted={!isActive && highlightLine}
			on:word-clicked={evaluateSyllable}
		/>
	{/each}
</div>
