<script lang="ts">
	import type { CibuleTaskType } from '$lib/types/lesson';
	import { fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import LessonWordLight from '$lib/components/LessonWordLight.svelte';
	import LessonTaskCibuleItem from './LessonTaskCibuleItem.svelte';

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
		content?: CibuleTaskType[number];
		/**
		 * The gap between the syllables in pixels.
		 */
		syllableGap?: number;
		markWantedSyllables?: boolean;
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
		markWantedSyllables = false,
		rowIndex = 0,
		registerElement,
		unregisterElement,
		idCorrectSyllable = 'syllable-assignement',
		idOtherSyllableBase = 'syllable-choice-'
	}: Props = $props();

	const correctIndexes =
		content.correctSyllable == undefined
			? content.syllables
					.map((item, index) => (item.includes(content.incorrectSyllable ?? '') ? -1 : index))
					.filter((index) => index !== -1)
					.reverse()
			: content.syllables
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

	const correctIndexesSet = new Set(correctIndexes);

	const getNextExpectingIndex = (): number => {
		return correctIndexes.pop() ?? -1;
	};
	let expectingBoxIndex = $state(0);

	let correctExpectingIndex = getNextExpectingIndex();

	const roundCompleteAudio = new Audio('/sound/positive.wav');
	roundCompleteAudio.volume = 0.1;

	const inOptions = { duration: 750, delay: 200 };
	const outOptions = { duration: 200 };

	let showProgressAfterMistake = $state(false);
	let usedIndexes = $state<number[]>([]);
	let usedBoxIndexes = $state<number[]>([]);

	const evaluateSyllable = (e: CustomEvent<{ word: string; id: string }>) => {
		showProgressAfterMistake = false;

		const columnIndex = +e.detail.id.replace(`${idOtherSyllableBase}`, '');
		const isCorrect = correctExpectingIndex == columnIndex;

		if (!isCorrect) {
			setTimeout(() => {
				showProgressAfterMistake = true;
				setTimeout(() => {
					showProgressAfterMistake = false;
				}, 3500);
			}, 4500);

			dispatch('incorrect-syllable-clicked', { ...e.detail, rowIndex });
			return;
		}

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

	const evaluateBoxSyllable = (e: CustomEvent<{ word: string; id: string }>) => {
		showProgressAfterMistake = false;

		if (content.binding == undefined) {
			return;
		}

		const columnIndex = +e.detail.id.replace(`${idOtherSyllableBase}`, '');
		const isCorrect = expectingBoxIndex == content.binding[columnIndex];

		if (!isCorrect) {
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
		usedBoxIndexes.push(expectingBoxIndex);
		expectingBoxIndex++;
		roundCompleteAudio.pause();
		roundCompleteAudio.currentTime = 0;
		roundCompleteAudio.play();

		if (usedIndexes.length == Object.keys(content.binding).length) {
			setTimeout(() => {
				dispatch('correct-syllable-clicked', { ...e.detail, rowIndex });
			}, 1000);
		}
	};
</script>

{#if isSyllableAssignmentPresent}
	<div class="relative">
		{#if isSyllableAssignmentVisible && isSyllableAssignmentPresent && content.correctSyllable}
			<div in:fade={inOptions} out:fade={outOptions} class="absolute">
				<LessonTaskCibuleItem
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
			<LessonWordLight
				word={(content.correctSyllable == undefined
					? content.incorrectSyllable
					: content.correctSyllable) ?? ''}
				id={idCorrectSyllable}
			/>
		</div>
	</div>
{/if}
<div class="flex" style="gap: {syllableGap}px;">
	{#each content.syllables as syllable, index}
		<LessonTaskCibuleItem
			disabled={false}
			word={syllable}
			id={`${idOtherSyllableBase}${index}`}
			{registerElement}
			{unregisterElement}
			isHighlighted={(markWantedSyllables && correctIndexesSet.has(index)) ||
				(showProgressAfterMistake && usedIndexes.includes(index))}
			isWrong={!correctIndexesSet.has(index)}
			on:word-clicked={content.binding == undefined ? evaluateSyllable : evaluateBoxSyllable}
		/>
	{/each}
</div>

{#if content.binding != undefined}
	<div class="mt-8 flex justify-center gap-2">
		{#each Object.entries(content.binding).sort(([, a], [, b]) => a - b) as [wordIndex, orderIndex]}
			<div
				class="flex h-16 w-16 items-center justify-center rounded-md border border-gray-300 shadow-sm"
			>
				{#if usedBoxIndexes.includes(orderIndex)}
					<span class="font-serif text-[30px] text-gray-700">{content.syllables[+wordIndex]}</span>
				{/if}
			</div>
		{/each}
	</div>
{/if}
