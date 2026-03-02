<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import { id, rawData } from '$lib/components/tasks/slabiky/levels/2';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import AudioHint from '$lib/components/common/AudioHint.svelte';
	import {
		defaultValidateStage,
		defaultValidateSymbol, getLevelData,
		getWordAudioSource
	} from '$lib/utils/trackLevelUtils';
	import { formatSlabikyRawData, slabikyLevelPreset } from '$lib/components/tasks/slabiky';
	import type { SlabikyRawDataEntry } from '$lib/components/tasks/slabiky/slabiky.types';

	const preset = slabikyLevelPreset.find((level) => level.levelID === id)?.content;
	const data = preset ? getLevelData<SlabikyRawDataEntry>(preset, rawData, formatSlabikyRawData) : null;
</script>

{#if data}
	<TrackLevel
		{id}
		{data}
		validateSymbol={defaultValidateSymbol}
		validateStage={defaultValidateStage}
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
			<SymbolTrack {symbols} {correctSymbols} {validateSymbolClick} symbolSpacing={16} />
		{/snippet}
	</TrackLevel>
{/if}
