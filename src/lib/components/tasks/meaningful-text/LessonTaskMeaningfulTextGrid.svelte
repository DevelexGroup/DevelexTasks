<script lang="ts">
	import type { MeaningfulTextTaskType } from '$lib/types/lesson';
	import LessonTaskMeaningfulTextLine from './LessonTaskMeaningfulTextLine.svelte';

	interface Props {
		content?: MeaningfulTextTaskType;
		width?: number;
		registerElement: (element: HTMLElement) => void;
		unregisterElement: (element: HTMLElement) => void;
	}

	let {
		content = [
			{
				words: ['pa', 'ra', 'pa', 'ga'],
				width: 200
			}
		],
		width,
		registerElement,
		unregisterElement
	}: Props = $props();
</script>

<div class="-mt-16 flex flex-col items-start justify-center space-y-12">
	{#if content}
		{#each content as task, rowIndex}
			{@const idWord = `text-word_${rowIndex}_`}
			<LessonTaskMeaningfulTextLine content={task} {registerElement} {unregisterElement} {idWord} />
		{/each}
	{/if}
</div>
