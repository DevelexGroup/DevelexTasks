<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import { id, rawData } from '$lib/components/tasks/cibule/levels/2/index';
	import AudioHint from '$lib/components/common/AudioHint.svelte';
	import {
		defaultValidateStage,
		defaultValidateSymbol, getLevelData,
		getWordAudioSource
	} from '$lib/utils/trackLevelUtils';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import { calculateFluencyScore, cibuleLevelPreset, formatCibuleRawData } from '$lib/components/tasks/cibule';
	import type { CibuleRawDataEntry } from '$lib/components/tasks/cibule/cibule.types';

	const preset = cibuleLevelPreset.find((level) => level.levelID === id)?.content;
	const data = preset ? getLevelData<CibuleRawDataEntry>(preset, rawData, formatCibuleRawData) : null;
</script>

{#if data}
	<TrackLevel
		{id}
		{data}
		validateSymbol={defaultValidateSymbol}
		validateStage={defaultValidateStage}
		{calculateFluencyScore}
		onCompleted={() => {
			taskStage.set(TaskStage.End);
		}}
	>
		{#snippet hintComponent({ state })}
			{#if state.dataEntry.sound}
				<AudioHint
					audioSrc={getWordAudioSource(state.dataEntry.sound)}
					playOnStart
					playOnStartDelay={750}
					ttsFallback={state.dataEntry.sound}
				/>
			{/if}
		{/snippet}
		{#snippet trackComponent({ symbols, correctSymbols, validateSymbolClick })}
			<SymbolTrack
				{symbols}
				{correctSymbols}
				{validateSymbolClick}
				letterSpacing={4}
				flattenRows={true}
				splitFiller={true}
			/>
		{/snippet}
	</TrackLevel>
{/if}
