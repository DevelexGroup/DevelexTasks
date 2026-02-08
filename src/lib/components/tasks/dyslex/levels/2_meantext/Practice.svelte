<script lang="ts">
	import { id } from '$lib/components/tasks/dyslex/levels/2_meantext/index';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import DyslexTrackLevel from '../../components/DyslexTrackLevel.svelte';
	import ParagraphGrid from '../../components/ParagraphGrid.svelte';
	import { meantextData } from '../../dyslex.data';

	const data = meantextData['practice'];
</script>

{#if data}
	<DyslexTrackLevel
		{id}
		repetitions={1}
		validateStage={() => true}
		isPractice={true}
		onCompleted={() => {
			taskStage.set(TaskStage.Instructions);
		}}
		offset={{ x: 0, y: -195 }}
	>
		<ParagraphGrid {data} lineGap={28} elementBufferSize={35} />
	</DyslexTrackLevel>
{/if}
