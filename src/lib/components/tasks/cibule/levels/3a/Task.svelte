<script lang="ts">
	import CibuleLevel from '$lib/components/tasks/cibule/components/CibuleLevel.svelte';
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';
	import { cibuleTestData } from '$lib/components/tasks/cibule/cibule.data';
	import {
		id,
		tryReadWordFromState,
		validateStage,
		validateSymbol
	} from '$lib/components/tasks/cibule/levels/3a/index';
	import type { CibuleState } from '$lib/components/tasks/cibule/cibule.types';
	import { resolveAny } from '$lib/utils/resolveAny';

	const data = cibuleTestData.find((level => level.levelID === id))?.content;

	const onSpace = (state: CibuleState) => {
		if (validateStage(state) === true)
			tryReadWordFromState(state);
		else {
			const mistakeSound = new Audio(resolveAny('/sound/mistake.mp3'));
			mistakeSound.volume = 0.4;
			mistakeSound.play();
		}
	}
</script>

{#if data}
<CibuleLevel {id} data={data} {validateSymbol} {validateStage} repetitions={3} onCompleted={() => {taskState.set(TaskState.End)}} onSpace={onSpace}/>
{/if}