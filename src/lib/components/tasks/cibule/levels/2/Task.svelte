<script lang="ts">
	import CibuleLevel from '$lib/components/tasks/cibule/components/CibuleLevel.svelte';
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';
	import { cibuleTestData } from '$lib/components/tasks/cibule/cibule.data';
	import { validateSymbol } from '$lib/components/tasks/cibule/levels/2/index';

	const id = 'level2';
	const data = cibuleTestData.find((level => level.levelID === id))?.content;
</script>

{#if data}
<CibuleLevel {id} data={data} {validateSymbol} repetitions={4} onCompleted={() => {taskState.set(TaskState.End)}} />
{/if}