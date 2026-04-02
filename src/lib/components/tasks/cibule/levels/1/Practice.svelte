<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage, type TrackTaskPreset } from '$lib/types/task.types';
	import { id, rawData } from '$lib/components/tasks/cibule/levels/1/index';
	import SymbolElement from '$lib/components/common/tracks/SymbolElement.svelte';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import { defaultValidateStage, defaultValidateSymbol, getLevelData } from '$lib/utils/trackLevelUtils';
	import { formatCibuleRawData, cibuleLevelPreset } from '$lib/components/tasks/cibule';
	import type { CibuleRawDataEntry } from '$lib/components/tasks/cibule/cibule.types';

	interface Props {
		taskPreset?: TrackTaskPreset<CibuleRawDataEntry>
		excludeTags?: string[]
	}

	let {
		taskPreset = cibuleLevelPreset,
		excludeTags
	 }: Props = $props();

	const levelContentPreset = taskPreset?.find((level) => level.levelID === id)?.practiceContent;
	const data = levelContentPreset ? getLevelData<CibuleRawDataEntry>(levelContentPreset, rawData, formatCibuleRawData, excludeTags) : null;
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
