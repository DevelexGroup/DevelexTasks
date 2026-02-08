<script lang="ts">
	import { id } from '$lib/components/tasks/dyslex/levels/3_pseudotext/index';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import DyslexTrackLevel from '../../components/DyslexTrackLevel.svelte';
	import ParagraphGrid from '../../components/ParagraphGrid.svelte';
	import { pseudotextData } from '../../dyslex.data';

	const data = pseudotextData['content'];
</script>

{#if data}
	<DyslexTrackLevel
		{id}
		repetitions={1}
		onCompleted={() => {
			taskStage.set(TaskStage.End);
		}}
		offset={{ x: 0, y: -102 }}
	>
		<ParagraphGrid {data} aoiName="pseudotext-content" lineGap={47} elementBufferSize={35} />
	</DyslexTrackLevel>
{/if}
