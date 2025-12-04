<script lang="ts">
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import { slabikyTestData } from '$lib/components/tasks/slabiky/slabiky.data';
	import { id, validateSymbol, validateStage } from '$lib/components/tasks/slabiky/levels/1/index';
	import SymbolElement from '$lib/components/common/tracks/SymbolElement.svelte';
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';

	const data = slabikyTestData.find((level => level.levelID === id))?.practiceContent;
</script>

{#if data}
<TrackLevel {id} data={data} {validateSymbol} {validateStage} isPractice={true} onCompleted={() => {taskStage.set(TaskStage.Instructions)}}>
	{#snippet hintComponent({ state })}
		<SymbolElement symbol={state.dataEntry.correct?.[0]} interactable={false} />
	{/snippet}
	{#snippet trackComponent({ symbols, validateSymbolClick })}
		<SymbolTrack {symbols} {validateSymbolClick} symbolSpacing={16} />
	{/snippet}
</TrackLevel>
{/if}