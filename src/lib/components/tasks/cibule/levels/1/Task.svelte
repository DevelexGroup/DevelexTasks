<script lang="ts">
	import CibuleLevel from '$lib/components/tasks/cibule/components/CibuleLevel.svelte';
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';

	const id = 'Cibule_1';
</script>

<CibuleLevel {id} onCompleted={() => {taskState.set(TaskState.End)}} />