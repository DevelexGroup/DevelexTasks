<script lang="ts">
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import DyslexTrackLevel from '../../components/DyslexTrackLevel.svelte';
	import { syllablesData } from '../../dyslex.data';
	import { id } from '$lib/components/tasks/dyslex/levels/syllables/index';
	import SyllableGrid from '../../components/SyllableGrid.svelte';

	const data = syllablesData['content'];
</script>

{#if data}
	<DyslexTrackLevel
		{id}
		{data}
		repetitions={1}
		validateStage={() => true}
		isPractice={false}
		onCompleted={() => {
			taskStage.set(TaskStage.End);
		}}
	>
		<SyllableGrid {data} gridSpacing={{ x: 65, y: 35 }} elementBufferSize={20} />
	</DyslexTrackLevel>
{/if}
