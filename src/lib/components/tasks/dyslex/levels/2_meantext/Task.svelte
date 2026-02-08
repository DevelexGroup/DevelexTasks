<script lang="ts">
	import { id } from '$lib/components/tasks/dyslex/levels/2_meantext/index';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import DyslexTrackLevel from '../../components/DyslexTrackLevel.svelte';
	import ParagraphGrid from '../../components/ParagraphGrid.svelte';
	import { meantextData } from '../../dyslex.data';

	const data = meantextData['content'];
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
		<ParagraphGrid {data} aoiName="meantext-content" lineGap={47} elementBufferSize={35} />
	</DyslexTrackLevel>
{/if}
