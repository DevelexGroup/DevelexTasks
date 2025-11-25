<script lang="ts">
	import CibuleLevel from '$lib/components/tasks/cibule/components/CibuleLevel.svelte';
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';
	import { cibuleTestData } from '$lib/components/tasks/cibule/cibule.data';
	import { validateSymbol } from '$lib/components/tasks/cibule/levels/2/index';
	import AudioHint from '$lib/components/common/AudioHint.svelte';
	import { resolveAny } from '$lib/utils/resolveAny';

	const id = 'level2';
	const data = cibuleTestData.find((level => level.levelID === id))?.practiceContent;

	function getAudioSource(word: string): string {
		return resolveAny(`/sound/words/${word}.ogg`);
	}
</script>

{#if data}
<CibuleLevel {id} data={data} {validateSymbol} isPractice={true} onCompleted={() => {taskState.set(TaskState.Instructions)}}>
	{#snippet hintComponent({ wordToRead })}
		{#if wordToRead}
		<AudioHint audioSrc={getAudioSource(wordToRead)} />
		{/if}
	{/snippet}
</CibuleLevel>
{/if}