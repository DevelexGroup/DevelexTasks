<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import { id } from '$lib/components/tasks/slabiky/levels/2/index';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import { slabikyTestData } from '$lib/components/tasks/slabiky/slabiky.data';
	import AudioHint from '$lib/components/common/AudioHint.svelte';
	import { defaultValidateStage, defaultValidateSymbol, getWordAudioSource } from '$lib/utils/trackLevelUtils';

	const data = slabikyTestData.find((level => level.levelID === id))?.content;
</script>

{#if data}
<TrackLevel {id} data={data} validateSymbol={defaultValidateSymbol} validateStage={defaultValidateStage} onCompleted={() => {taskStage.set(TaskStage.End)}}>
	{#snippet hintComponent({ state })}
		{#if state.dataEntry.wordToRead}
			<AudioHint audioSrc={getWordAudioSource(state.dataEntry.wordToRead)} playOnStart playOnStartDelay={750} ttsFallback={state.dataEntry.wordToRead} />
		{/if}
	{/snippet}
	{#snippet trackComponent({ symbols, correctSymbols, validateSymbolClick })}
		<SymbolTrack {symbols} {correctSymbols} {validateSymbolClick} symbolSpacing={16} />
	{/snippet}
</TrackLevel>
{/if}