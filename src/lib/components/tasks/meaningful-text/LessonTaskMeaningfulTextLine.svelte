<script lang="ts">
	import type { MeaningfulTextTaskType } from '$lib/types/lesson';
	import LessonTaskMeaningfulTextItem from './LessonTaskMeaningfulTextItem.svelte';

	interface Props {
		content?: MeaningfulTextTaskType[number];
		registerElement: (element: HTMLElement) => void;
		unregisterElement: (element: HTMLElement) => void;
		idWord?: string;
	}

	let {
		content = {
			words: ['pa', 'ra', 'pa', 'ga'],
			width: 200
		},
		registerElement,
		unregisterElement,
		idWord = 'text-word-'
	}: Props = $props();
</script>

<div class="flex items-center justify-between" style="width: {content.width}px;">
	{#each content.words as syllable, index}
		<div>
			<LessonTaskMeaningfulTextItem
				word={syllable}
				id={`${idWord}${index}`}
				{registerElement}
				{unregisterElement}
			/>
		</div>
	{/each}
</div>
