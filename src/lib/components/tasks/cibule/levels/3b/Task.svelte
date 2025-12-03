<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';
	import { cibuleTestData } from '$lib/components/tasks/cibule/cibule.data';
	import { id, onSpace, validateSymbol, validateStage, isSyllableFrameVisible	} from '$lib/components/tasks/cibule/levels/3b/index';
	import CibuleSyllableFrame from '$lib/components/tasks/cibule/components/CibuleSyllableFrame.svelte';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';

	const data = cibuleTestData.find((level => level.levelID === id))?.content;
</script>

{#if data}
<TrackLevel {id} data={data} {validateSymbol} {validateStage} onCompleted={() => {taskState.set(TaskState.End)}} onSpace={onSpace}>
	{#snippet extraComponent({ state })}
		<div class="flex gap-4">
			{#each state.dataEntry.correct as syllable, index (index)}
				<CibuleSyllableFrame {syllable} visible={isSyllableFrameVisible(state, syllable)} />
			{/each}
		</div>
	{/snippet}
	{#snippet trackComponent({ symbols, validateSymbolClick })}
		<SymbolTrack {symbols} {validateSymbolClick} letterSpacing={4} flattenRows={true} />
	{/snippet}
</TrackLevel>
{/if}