<script lang="ts">
	import type { VisualDiffTaskType } from '$lib/types/lesson';
	import { fade } from 'svelte/transition';
	import { createEventDispatcher, getContext } from 'svelte';
	import LessonWordLight from '$lib/components/LessonWordLight.svelte';
	import LessonTaskVisualDiffItem from './LessonTaskVisualDiffItem.svelte';
	import LessonTaskVisualDiffGroup from './LessonTaskVisualDiffGroup.svelte';
	import { handleLog } from '$lib/utils/logger';
	import { resolveAny } from '$lib/utils/resolveAny';

	interface Props {
		isSyllableAssignmentVisible?: boolean;
		isSyllableAssignmentPresent?: boolean;
		content?: VisualDiffTaskType[number];
		syllableGap?: number;
		markWantedSyllables?: boolean;
		rowIndex?: number;
		registerElement: (element: HTMLElement) => void;
		unregisterElement: (element: HTMLElement) => void;
		idCorrectSyllable?: string;
		idOtherSyllableBase?: string;
		gridCols: number;
	}

	let {
		isSyllableAssignmentVisible = true,
		isSyllableAssignmentPresent = true,
		content = {
			syllables: ['pa', 'ra', 'pa', 'ga'],
			correctSyllable: 'pa'
		},
		syllableGap = 12,
		markWantedSyllables = false,
		rowIndex = 0,
		registerElement,
		unregisterElement,
		idCorrectSyllable = 'visdiff-assignement',
		idOtherSyllableBase = 'visdiff-choice-',
		gridCols = 0
	}: Props = $props();

	const correctIndexes = content.syllables
		.map((item, index) => (item === content.correctSyllable ? index : -1))
		.filter((index) => index !== -1)
		.reverse();

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

	const sessionId = getContext<string>('sessionId');
	const correctIndexesSet = new Set(correctIndexes);

	const getNextExpectingIndex = (): number => {
		return correctIndexes.pop() ?? -1;
	};

	let correctExpectingIndex = getNextExpectingIndex();

	const roundCompleteAudio = new Audio(resolveAny('/sound/positive.wav'));
	roundCompleteAudio.volume = 0.4;

	const inOptions = { duration: 750, delay: 200 };
	const outOptions = { duration: 200 };

	let showProgressAfterMistake = $state(false);
	let usedIndexes = $state<number[]>([]);
	let timeout: number | null = null;

	const evaluateSyllable = (e: CustomEvent<{ word: string; id: string }>) => {
		showProgressAfterMistake = false;
		timeout != null && clearTimeout(timeout);

		const columnIndex = +e.detail.id.replace(`${idOtherSyllableBase}`, '');
		const isCorrect = correctExpectingIndex == columnIndex;

		if (!isCorrect) {
			showProgressAfterMistake = true;
			timeout = setTimeout(() => {
				showProgressAfterMistake = false;
			}, 3500);

			dispatch('incorrect-syllable-clicked', { ...e.detail, rowIndex });
			return;
		}

		handleLog(sessionId, 'click', 'correct', 'vis-diff');

		if (correctIndexes.length > 0) {
			usedIndexes.push(correctExpectingIndex);
			correctExpectingIndex = getNextExpectingIndex();
			roundCompleteAudio.pause();
			roundCompleteAudio.currentTime = 0;
			roundCompleteAudio.play();
		} else {
			dispatch('correct-syllable-clicked', { ...e.detail, rowIndex });
		}
	};

	const evaluateGroup = (e: CustomEvent<{ word: string; id: string }>) => {
		showProgressAfterMistake = false;

		const columnIndex = +e.detail.id.replace(`${idOtherSyllableBase}`, '');
		const isCorrect = content.correctGroupIndex == columnIndex;

		if (isCorrect) {
			dispatch('correct-syllable-clicked', { ...e.detail, rowIndex });
		} else {
			dispatch('incorrect-syllable-clicked', { ...e.detail, rowIndex });
		}
	};
</script>

{#if isSyllableAssignmentPresent}
	<div class="relative flex items-center">
		{#if isSyllableAssignmentVisible && isSyllableAssignmentPresent && content.correctSyllable}
			<div in:fade={inOptions} out:fade={outOptions} class="absolute">
				<LessonTaskVisualDiffItem
					disabled={true}
					word={content.correctSyllable}
					id={idCorrectSyllable}
					{registerElement}
					{unregisterElement}
				/>
			</div>
		{/if}
		<!-- Shadow LessonWord without gaze registration to -->
		<div class="pointer-events-none select-none text-red-400 opacity-0">
			<LessonWordLight word={content.correctSyllable ?? ''} id={idCorrectSyllable} />
		</div>
	</div>
{/if}
<div
	class="flex"
	style={`gap: ${syllableGap}px; ${gridCols > 0 ? `display: grid; grid-template-columns: repeat(${gridCols}, minmax(0, 1fr));` : ''}`}
>
	{#if content.syllables.length == 0 && content.groups != undefined}
		{#each content.groups as group, index}
			<LessonTaskVisualDiffGroup
				disabled={false}
				words={group}
				id={`${idOtherSyllableBase}${index}`}
				{registerElement}
				{unregisterElement}
				on:word-clicked={evaluateGroup}
			/>
		{/each}
	{:else}
		{#each content.syllables as syllable, index}
			<LessonTaskVisualDiffItem
				disabled={false}
				word={syllable}
				id={`${idOtherSyllableBase}${index}`}
				{registerElement}
				{unregisterElement}
				isHighlighted={(markWantedSyllables && correctIndexesSet.has(index)) ||
					(showProgressAfterMistake && usedIndexes.includes(index))}
				isWrong={!correctIndexesSet.has(index)}
				on:word-clicked={evaluateSyllable}
			/>
		{/each}
	{/if}
</div>
