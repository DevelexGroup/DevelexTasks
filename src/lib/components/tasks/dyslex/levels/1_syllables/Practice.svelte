<script lang="ts">
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import DyslexTrackLevel from '../../components/DyslexTrackLevel.svelte';
	import { syllablesData } from '../../dyslex.data';
	import { id } from '$lib/components/tasks/dyslex/levels/1_syllables/index';
	import SyllableGrid from '../../components/SyllableGrid.svelte';

	const data = syllablesData['practice'];
	const rows = data.length;
	const cols = data[0]?.length || 0;
</script>

{#if data}
	<DyslexTrackLevel
		{id}
		{data}
		repetitions={1}
		validateStage={() => true}
		isPractice={true}
		onCompleted={() => {
			taskStage.set(TaskStage.Instructions);
		}}
	>
		<SyllableGrid {data} gridSpacing={{ x: 120, y: 120 }} />
	</DyslexTrackLevel>
{/if}
