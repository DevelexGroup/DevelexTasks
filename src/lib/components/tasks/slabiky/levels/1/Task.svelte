<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';
	import { id, validateSymbol, validateStage } from '$lib/components/tasks/slabiky/levels/1/index';
	import SymbolElement from '$lib/components/common/tracks/SymbolElement.svelte';
	import SymbolMultiTrack from '$lib/components/common/tracks/SymbolMultiTrack.svelte';
	import { slabikyTestData } from '$lib/components/tasks/slabiky/slabiky.data';

	const data = slabikyTestData.find((level => level.levelID === id))?.content;
</script>

{#if data}
<TrackLevel {id} data={data} {validateSymbol} {validateStage} onCompleted={() => {taskState.set(TaskState.End)}}>
	{#snippet hintComponent({ state })}
		<SymbolElement symbol={state.dataEntry.correctSyllables?.[0]} interactable={false} />
	{/snippet}
	{#snippet trackComponent({ symbols, validateSymbolClick })}
		<SymbolMultiTrack {symbols} {validateSymbolClick} symbolSpacing={16} />
	{/snippet}
</TrackLevel>
{/if}