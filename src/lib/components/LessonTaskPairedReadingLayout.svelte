<script lang="ts">
	import { fade } from 'svelte/transition';
	import LessonCross from './LessonCross.svelte';
	import LessonWord from './LessonWord.svelte';
	import type { WordMetadata } from './LessonTaskPairedReadingLevel.utility';
	import { PairedReadingIdManager } from './LessonTaskPairedReadingLevel.utility';

	interface Props {
		words: WordMetadata[][];
		xGap?: number;
		yGap?: number;
		fontSize?: number;
		font?: 'times' | 'arial';
		stage?: 'crossStart' | 'reading' | 'crossEnd';
		crossStartPosition?: 'top' | 'center';
		backgroundColor?: string;
		shouldHighlight?: boolean;
		wordsRegisterFn: (element: HTMLElement) => void;
		wordsUnregisterFn: (element: HTMLElement) => void;
		crossRegisterFn: (element: HTMLElement) => void;
		crossUnregisterFn: (element: HTMLElement) => void;
	}

	let {
		words,
		xGap = 10,
		yGap = 5,
		fontSize = 30,
		font = 'times',
		stage = 'crossStart',
		crossStartPosition = 'center',
		backgroundColor = '#FFFEE8',
		shouldHighlight = true,
		wordsRegisterFn,
		wordsUnregisterFn,
		crossRegisterFn,
		crossUnregisterFn
	}: Props = $props();

	const fadeInParams = {
		duration: 300,
		delay: 300
	};

	const fadeOutParams = {
		duration: 300,
		delay: 0
	};

	let enhancedWords = $derived(
		words.map((row, rowIndex) =>
			row.map((word, colIndex) => {
				const result = {
					...word,
					chainLeft: word.isInActiveSegment && colIndex > 0 && row[colIndex - 1].isInActiveSegment,
					chainRight:
						word.isInActiveSegment &&
						colIndex < row.length - 1 &&
						row[colIndex + 1].isInActiveSegment &&
						word.isInActiveSegment
				};
				return result;
			})
		)
	);
</script>

<div
	class="relative flex h-screen w-screen items-center justify-center p-20"
	style="background-color: {backgroundColor};"
>
	{#if stage === 'crossStart'}
		<div
			class="absolute left-20"
			class:top-20={crossStartPosition === 'top'}
			in:fade={{ ...fadeInParams }}
			out:fade={{ ...fadeOutParams }}
		>
			<LessonCross
				id={PairedReadingIdManager.getFixCrossAId()}
				registerElement={crossRegisterFn}
				unregisterElement={crossUnregisterFn}
			/>
		</div>
	{/if}

	{#if stage === 'crossEnd'}
		<div
			class="absolute bottom-20 right-20"
			in:fade={{ ...fadeInParams }}
			out:fade={{ ...fadeOutParams }}
		>
			<LessonCross
				id={PairedReadingIdManager.getFixCrossBId()}
				registerElement={crossRegisterFn}
				unregisterElement={crossUnregisterFn}
			/>
		</div>
	{/if}

	{#if stage === 'reading'}
		<!-- This is the layout for the Paired Reading task content. -->
		<div
			class="absolute flex flex-col"
			style="gap: {yGap}px;"
			in:fade={{ ...fadeInParams }}
			out:fade={{ ...fadeOutParams }}
		>
			{#each enhancedWords as row, rowIndex}
				<div class="items-left flex justify-start" style="gap: {xGap}px;">
					{#each row as word, i (rowIndex + '-' + word.id)}
						<LessonWord
							registerElement={wordsRegisterFn}
							unregisterElement={wordsUnregisterFn}
							word={word.text}
							id={word.id}
							size={fontSize}
							{font}
							isDeHighlighted={!word.isInActiveSegment}
							isHighlighted={word.isInActiveSegment && shouldHighlight}
							inbetweenGap={xGap}
							chainLeft={word.chainLeft}
							chainRight={word.chainRight}
						/>
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</div>
