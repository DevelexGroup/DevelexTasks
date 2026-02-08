<script lang="ts">
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import DyslexTrackLevel from '../../components/DyslexTrackLevel.svelte';
	import { syllablesData } from '../../dyslex.data';
	import { id } from '$lib/components/tasks/dyslex/levels/1_syllables/index';
	import SyllableGrid from '../../components/SyllableGrid.svelte';

	const data = syllablesData['practice'];
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
		offset={{ x: -65, y: -60 }}
	>
		<SyllableGrid align="start" {data} gridSpacing={{ x: 135, y: 85 }} />
	</DyslexTrackLevel>
{/if}
