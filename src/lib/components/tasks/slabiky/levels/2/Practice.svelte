<script lang="ts">
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';
	import { slabikyTestData } from '$lib/components/tasks/slabiky/slabiky.data';
	import { id, validateSymbol, validateStage } from '$lib/components/tasks/slabiky/levels/2/index';
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import SymbolMultiTrack from '$lib/components/common/tracks/SymbolMultiTrack.svelte';
	import { getWordAudioSource } from '$lib/components/tasks/cibule';
	import AudioHint from '$lib/components/common/AudioHint.svelte';

	const data = slabikyTestData.find((level => level.levelID === id))?.practiceContent;
</script>

{#if data}
<TrackLevel {id} data={data} {validateSymbol} {validateStage} isPractice={true} onCompleted={() => {taskState.set(TaskState.Instructions)}}>
	{#snippet hintComponent({ state })}
		{#if state.dataEntry.wordToRead}
			<AudioHint audioSrc={getWordAudioSource(state.dataEntry.wordToRead)} playOnStart playOnStartDelay={750} />
		{/if}
	{/snippet}
	{#snippet trackComponent({ symbols, validateSymbolClick })}
		<SymbolMultiTrack {symbols} {validateSymbolClick} symbolSpacing={16} />
	{/snippet}
</TrackLevel>
{/if}