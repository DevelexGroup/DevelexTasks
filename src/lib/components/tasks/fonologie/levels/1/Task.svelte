<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import { id, rawData } from '$lib/components/tasks/fonologie/levels/1/index';
	import SymbolElement from '$lib/components/common/tracks/SymbolElement.svelte';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import { defaultValidateStage, defaultValidateSymbol, getLevelData } from '$lib/utils/trackLevelUtils';
	import { fonologieLevelPreset, formatFonologieRawData, getShowcaseData } from '$lib/components/tasks/fonologie';
	import type { FonologieAudioRawDataEntry } from '$lib/components/tasks/fonologie/fonologie.types';

	const preset = fonologieLevelPreset.find((level) => level.levelID === id)?.content;
	const data = preset ? getLevelData<FonologieAudioRawDataEntry>(preset, rawData, formatFonologieRawData) : null;
	const showcaseData = data ? getShowcaseData(data) : null;
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
			<SymbolElement symbol={state.dataEntry.correct?.[0]} interactable={false} />
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
