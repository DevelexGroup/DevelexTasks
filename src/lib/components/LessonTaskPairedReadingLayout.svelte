<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { WordMetadata } from './LessonTaskPairedReadingLevel.utility';
	import LessonCross from './LessonCross.svelte';
	import { PairedReadingIdManager } from './LessonTaskPairedReadingLevel.utility';
	import LessonWord from './LessonWord.svelte';

	export let words: WordMetadata[][];

	export let xGap: number = 10;

	export let yGap: number = 5;

	export let stage: 'crossStart' | 'reading' | 'crossEnd' = 'crossStart';

	export let crossStartPosition: 'top' | 'center' = 'center';

	export let wordsRegisterFn: (element: HTMLElement) => void;
	export let wordsUnregisterFn: (element: HTMLElement) => void;
	export let crossRegisterFn: (element: HTMLElement) => void;
	export let crossUnregisterFn: (element: HTMLElement) => void;

	const fadeInParams = {
		duration: 300,
		delay: 300
	};

	const fadeOutParams = {
		duration: 300,
		delay: 0
	};
</script>

<div class="relative flex h-screen w-screen items-center justify-center p-20">
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
			{#each words as row}
				<div class="items-left flex justify-start" style="gap: {xGap}px;">
					{#each row as word}
						<LessonWord
							registerElement={wordsRegisterFn}
							unregisterElement={wordsUnregisterFn}
							word={word.text}
							id={word.id}
							isHighlighted={word.isInActiveSegment}
						/>
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</div>
