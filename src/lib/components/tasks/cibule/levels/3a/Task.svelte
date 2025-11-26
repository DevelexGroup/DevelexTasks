<script lang="ts">
	import CibuleLevel from '$lib/components/tasks/cibule/components/CibuleLevel.svelte';
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';
	import { cibuleTestData } from '$lib/components/tasks/cibule/cibule.data';
	import { id, validateSymbol } from '$lib/components/tasks/cibule/levels/3a/index';

	const data = cibuleTestData.find((level => level.levelID === id))?.content;

	const tryReadWord = (state: CibuleState) => {

	};
</script>

{#if data}
<CibuleLevel {id} data={data} {validateSymbol} repetitions={3} onCompleted={() => {taskState.set(TaskState.End)}} onSpace={tryReadWord}/>
{/if}