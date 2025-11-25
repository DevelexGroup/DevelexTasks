<script lang="ts">
	import CibuleLevel from '$lib/components/tasks/cibule/components/CibuleLevel.svelte';
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';
	import { cibuleTestData } from '$lib/components/tasks/cibule/cibule.data';
	import { validateSymbol } from '$lib/components/tasks/cibule/levels/2/index';

	const id = 'level1';
	const data = cibuleTestData.find((level => level.levelID === id))?.practiceContent;
</script>

{#if data}
<CibuleLevel {id} data={data} {validateSymbol} isPractice={true} onCompleted={() => {taskState.set(TaskState.Instructions)}}>
	{#snippet hintComponent({ wordToRead })}
		<
	{/snippet}
</CibuleLevel>
{/if}