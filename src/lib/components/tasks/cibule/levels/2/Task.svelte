<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import { id, rawData } from '$lib/components/tasks/cibule/levels/2/index';
	import AudioHint from '$lib/components/common/AudioHint.svelte';
	import { defaultValidateStage, defaultValidateSymbol, getWordAudioSource } from '$lib/utils/trackLevelUtils';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import { getCibuleLevelData } from '$lib/components/tasks/cibule/utils/levelLoader';
	import { cibuleLevelPreset } from '$lib/components/tasks/cibule';

	const preset = cibuleLevelPreset.find((level => level.levelID === id))?.content;
	const data = preset ? getCibuleLevelData(preset, rawData) : null;
</script>

{#if data}
<TrackLevel {id} data={data} validateSymbol={defaultValidateSymbol} validateStage={defaultValidateStage} onCompleted={() => {taskStage.set(TaskStage.End)}}>
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