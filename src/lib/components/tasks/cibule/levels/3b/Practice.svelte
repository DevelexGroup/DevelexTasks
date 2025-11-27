<script lang="ts">
	import CibuleLevel from '$lib/components/tasks/cibule/components/CibuleLevel.svelte';
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';
	import { cibuleTestData } from '$lib/components/tasks/cibule/cibule.data';
	import { id, onSpace, validateSymbol, validateStage, isSyllableFrameVisible } from '$lib/components/tasks/cibule/levels/3b/index';
	import CibuleSyllableFrame from '$lib/components/tasks/cibule/components/CibuleSyllableFrame.svelte';

	const data = cibuleTestData.find((level => level.levelID === id))?.practiceContent;
</script>

{#if data}
<CibuleLevel {id} data={data} {validateSymbol} {validateStage} isPractice={true} onCompleted={() => {taskState.set(TaskState.Instructions)}} onSpace={onSpace}>
	{#snippet extraComponent({ state })}
		<div class="flex gap-4">
			{#each state.dataEntry.correctSyllables as syllable, index (index)}
				<CibuleSyllableFrame {syllable} visible={isSyllableFrameVisible(state, syllable)} />
			{/each}
		</div>
	{/snippet}
</CibuleLevel>
{/if}