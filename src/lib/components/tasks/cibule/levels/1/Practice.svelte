<script lang="ts">
	import CibuleLevel from '$lib/components/tasks/cibule/components/CibuleLevel.svelte';
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';
	import { cibuleTestData } from '$lib/components/tasks/cibule/cibule.types';

	const id = 'level1';
	const data = cibuleTestData.find((level => level.levelID === id))?.practiceContent[0];
</script>

{#if data}
<CibuleLevel {id} data={data} isPractice={true} onCompleted={() => {taskState.set(TaskState.Instructions)}} />
{/if}