<script lang="ts">
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import { id, rawData } from '$lib/components/tasks/slabiky/levels/1';
	import SymbolElement from '$lib/components/common/tracks/SymbolElement.svelte';
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import { defaultValidateStage, defaultValidateSymbol, getLevelData } from '$lib/utils/trackLevelUtils';
	import { slabikyLevelPreset } from '$lib/components/tasks/slabiky';
	import type { SlabikyRawDataEntry } from '$lib/components/tasks/slabiky/slabiky.types';
	import { formatSlabikyRawData } from '$lib/components/tasks/slabiky';

	const preset = slabikyLevelPreset.find((level) => level.levelID === id)?.practiceContent;
	const data = preset ? getLevelData<SlabikyRawDataEntry>(preset, rawData, formatSlabikyRawData) : null;
</script>

{#if data}
	<TrackLevel
		{id}
		{data}
		validateSymbol={defaultValidateSymbol}
		validateStage={defaultValidateStage}
		isPractice={true}
		onCompleted={() => {
			taskStage.set(TaskStage.Instructions);
		}}
	>
		{#snippet hintComponent({ state })}
			<SymbolElement symbol={state.dataEntry.correct?.[0]} interactable={false} />
		{/snippet}
		{#snippet trackComponent({ symbols, correctSymbols, validateSymbolClick })}
			<SymbolTrack {symbols} {correctSymbols} {validateSymbolClick} symbolSpacing={16} />
		{/snippet}
	</TrackLevel>
{/if}
