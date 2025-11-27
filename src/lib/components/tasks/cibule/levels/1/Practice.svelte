<script lang="ts">
	import CibuleLevel from '$lib/components/tasks/cibule/components/CibuleLevel.svelte';
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';
	import { cibuleTestData } from '$lib/components/tasks/cibule/cibule.data';
	import { id, validateSymbol, validateStage } from '$lib/components/tasks/cibule/levels/1/index';
	import CibuleSymbol from '$lib/components/tasks/cibule/components/CibuleSymbol.svelte';

	const data = cibuleTestData.find((level => level.levelID === id))?.practiceContent;
</script>

{#if data}
<CibuleLevel {id} data={data} {validateSymbol} {validateStage} isPractice={true} onCompleted={() => {taskState.set(TaskState.Instructions)}}>
	{#snippet hintComponent({ state })}
		<CibuleSymbol symbol={state.dataEntry.correctSyllables?.[0]} interactable={false} />
	{/snippet}
</CibuleLevel>
{/if}