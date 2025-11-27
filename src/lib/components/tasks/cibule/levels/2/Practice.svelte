<script lang="ts">
	import CibuleLevel from '$lib/components/tasks/cibule/components/CibuleLevel.svelte';
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';
	import { cibuleTestData } from '$lib/components/tasks/cibule/cibule.data';
	import { id, validateSymbol, validateStage } from '$lib/components/tasks/cibule/levels/2/index';
	import AudioHint from '$lib/components/common/AudioHint.svelte';
	import { getWordAudioSource } from '$lib/components/tasks/cibule';

	const data = cibuleTestData.find((level => level.levelID === id))?.practiceContent;
</script>

{#if data}
<CibuleLevel {id} data={data} {validateSymbol} {validateStage} isPractice={true} onCompleted={() => {taskState.set(TaskState.Instructions)}}>
	{#snippet hintComponent({ wordToRead })}
		{#if wordToRead}
			<AudioHint audioSrc={getWordAudioSource(wordToRead)} playOnStart playOnStartDelay={750} />
		{/if}
	{/snippet}
</CibuleLevel>
{/if}