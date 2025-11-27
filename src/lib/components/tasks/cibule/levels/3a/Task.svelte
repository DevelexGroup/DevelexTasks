<script lang="ts">
	import CibuleLevel from '$lib/components/tasks/cibule/components/CibuleLevel.svelte';
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';
	import { cibuleTestData } from '$lib/components/tasks/cibule/cibule.data';
	import { id, validateStage, validateSymbol } from '$lib/components/tasks/cibule/levels/3a/index';
	import type { CibuleState } from '$lib/components/tasks/cibule/cibule.types';

	const data = cibuleTestData.find((level => level.levelID === id))?.content;

	const tryReadWord = (state: CibuleState) => {

	};
</script>

{#if data}
<CibuleLevel {id} data={data} {validateSymbol} {validateStage} repetitions={3} onCompleted={() => {taskState.set(TaskState.End)}} onSpace={tryReadWord}/>
{/if}