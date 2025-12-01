<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';
	import { cibuleTestData } from '$lib/components/tasks/cibule/cibule.data';
	import { id, validateSymbol, validateStage } from '$lib/components/tasks/cibule/levels/2/index';
	import AudioHint from '$lib/components/common/AudioHint.svelte';
	import { getWordAudioSource } from '$lib/components/tasks/cibule';
	import SymbolSingleTrack from '$lib/components/common/tracks/SymbolSingleTrack.svelte';

	const data = cibuleTestData.find((level => level.levelID === id))?.content;
</script>

{#if data}
<TrackLevel {id} data={data} {validateSymbol} {validateStage} onCompleted={() => {taskState.set(TaskState.End)}}>
	{#snippet hintComponent({ state })}
		{#if state.dataEntry.wordToRead}
			<AudioHint audioSrc={getWordAudioSource(state.dataEntry.wordToRead)} playOnStart playOnStartDelay={750} />
		{/if}
	{/snippet}
	{#snippet trackComponent({ symbols, validateSymbolClick })}
		<SymbolSingleTrack {symbols} {validateSymbolClick} letterSpacing={4} />
	{/snippet}
</TrackLevel>
{/if}