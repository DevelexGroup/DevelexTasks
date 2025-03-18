<script lang="ts">
	import { fade } from 'svelte/transition';
	import LessonWord from './LessonWord.svelte';
	import type { WordMetadata } from './LessonTaskPairedReadingLevel.utility';
	import { PairedReadingIdManager } from './LessonTaskPairedReadingLevel.utility';
	import DwellTarget from './DwellTarget.svelte';
	type DwellState = 'active' | 'disabled' | 'activeDwelling' | 'dwellCancelled';

	interface Props {
		words: WordMetadata[][];
		xGap?: number;
		yGap?: number;
		fontSize?: number;
		font?: 'times' | 'arial';
		stage: 'crossStart' | 'reading' | 'crossEnd';
		crossStartPosition?: 'top' | 'center';
		backgroundColor?: string;
		shouldHighlight?: boolean;
		wordsRegisterFn: (element: HTMLElement) => void;
		wordsUnregisterFn: (element: HTMLElement) => void;
		gazeManager: any;
		dwellTimeMs?: number;
		onCrossAFixated?: () => void;
		onCrossBFixated?: () => void;
	}

	let {
		words,
		xGap = 10,
		yGap = 5,
		fontSize = 30,
		font = 'times',
		stage,
		crossStartPosition = 'center',
		backgroundColor = '#FFFEE8',
		shouldHighlight = true,
		wordsRegisterFn,
		wordsUnregisterFn,
		gazeManager,
		dwellTimeMs = 800,
		onCrossAFixated,
		onCrossBFixated
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

	// Constants for eye dimensions
	const EYE_WIDTH = 120;
	const EYE_HEIGHT = 70;

	// Determine the state of each cross based on the current stage
	const crossAState = $derived.by(() => (stage === 'crossStart' ? 'active' : 'disabled'));
	const crossBState = $derived.by(() => (stage === 'crossEnd' ? 'active' : 'disabled'));
</script>

<div
	class="relative flex h-screen w-screen items-center justify-center p-20"
	style="background-color: {backgroundColor};"
>
	{#if stage === 'crossStart'}
		<!-- Start cross (always visible, state depends on stage) -->
		<div
			class="absolute left-20"
			class:top-20={crossStartPosition === 'top'}
			in:fade={{ ...fadeInParams }}
			out:fade={{ ...fadeOutParams }}
		>
			<DwellTarget
				{gazeManager}
				id={PairedReadingIdManager.getFixCrossAId()}
				{dwellTimeMs}
				eyeWidth={EYE_WIDTH}
				eyeHeight={EYE_HEIGHT}
				onDwellComplete={onCrossAFixated}
				dwellState={crossAState}
			/>
		</div>
	{/if}

	{#if stage === 'crossEnd' || stage === 'reading'}
		<!-- End cross (always visible, state depends on stage) -->
		<div class="absolute bottom-20 right-20" in:fade={{ ...fadeInParams }}>
			<DwellTarget
				{gazeManager}
				id={PairedReadingIdManager.getFixCrossBId()}
				{dwellTimeMs}
				eyeWidth={EYE_WIDTH}
				eyeHeight={EYE_HEIGHT}
				onDwellComplete={onCrossBFixated}
				dwellState={crossBState}
			/>
		</div>
	{/if}

	<!-- Reading content (only visible during reading stage) -->
	{#if stage === 'reading'}
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
