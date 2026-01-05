<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import { cibuleTestData } from '$lib/components/tasks/cibule/cibule.data';
	import { id } from '$lib/components/tasks/cibule/levels/2/index';
	import AudioHint from '$lib/components/common/AudioHint.svelte';
	import { defaultValidateStage, defaultValidateSymbol, getWordAudioSource } from '$lib/utils/trackLevelUtils';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';

	const data = cibuleTestData.find((level => level.levelID === id))?.practiceContent;
</script>

{#if data}
<TrackLevel {id} data={data} validateSymbol={defaultValidateSymbol} validateStage={defaultValidateStage} isPractice={true} onCompleted={() => {taskStage.set(TaskStage.Instructions)}}>
	{#snippet hintComponent({ state })}
		{#if state.dataEntry.wordToRead}
			<AudioHint audioSrc={getWordAudioSource(state.dataEntry.wordToRead)} playOnStart playOnStartDelay={750} ttsFallback={state.dataEntry.wordToRead} />
		{/if}
	{/snippet}
	{#snippet trackComponent({ symbols, correctSymbols, validateSymbolClick })}
		<SymbolTrack {symbols} {correctSymbols} {validateSymbolClick} letterSpacing={4} flattenRows={true} splitFiller={true} />
	{/snippet}
</TrackLevel>
{/if}