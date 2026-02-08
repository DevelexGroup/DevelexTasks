<script lang="ts">
	import { id } from '$lib/components/tasks/dyslex/levels/3_pseudotext/index';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import DyslexTrackLevel from '../../components/DyslexTrackLevel.svelte';
	import ParagraphGrid from '../../components/ParagraphGrid.svelte';
	import { pseudotextData } from '../../dyslex.data';

	const data = pseudotextData['practice'];
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
		<ParagraphGrid {data} aoiName="pseudotext-practice" lineGap={28} elementBufferSize={35} />
	</DyslexTrackLevel>
{/if}
