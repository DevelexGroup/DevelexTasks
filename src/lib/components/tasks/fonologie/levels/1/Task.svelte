<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import { fonologieTestData } from '$lib/components/tasks/fonologie/fonologie.data';
	import { id } from '$lib/components/tasks/fonologie/levels/1/index';
	import SymbolElement from '$lib/components/common/tracks/SymbolElement.svelte';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import { defaultValidateStage, defaultValidateSymbol } from '$lib/utils/trackLevelUtils';

	const data = fonologieTestData.find((level) => level.levelID === id)?.content;
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
