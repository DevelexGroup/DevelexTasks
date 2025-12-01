<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';
	import { cibuleTestData } from '$lib/components/tasks/cibule/cibule.data';
	import { id, onSpace, validateSymbol, validateStage } from '$lib/components/tasks/cibule/levels/3a/index';
	import SymbolSingleTrack from '$lib/components/common/tracks/SymbolSingleTrack.svelte';

	const data = cibuleTestData.find((level => level.levelID === id))?.content;
</script>

{#if data}
<TrackLevel {id} data={data} {validateSymbol} {validateStage} repetitions={2} onCompleted={() => {taskState.set(TaskState.End)}} onSpace={onSpace}>
	{#snippet trackComponent({ symbols, validateSymbolClick })}
		<SymbolSingleTrack {symbols} {validateSymbolClick} letterSpacing={4} />
	{/snippet}
</TrackLevel>
{/if}