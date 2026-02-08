<script lang="ts">
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import DyslexTrackLevel from '../../components/DyslexTrackLevel.svelte';
	import { syllablesData } from '../../dyslex.data';
	import { id } from '$lib/components/tasks/dyslex/levels/1_syllables/index';
	import SyllableGrid from '../../components/SyllableGrid.svelte';

	const data = syllablesData['content'];
</script>

{#if data}
	<DyslexTrackLevel
		{id}
		repetitions={1}
		validateStage={() => true}
		isPractice={false}
		onCompleted={() => {
			taskStage.set(TaskStage.End);
		}}
		offset={{ x: 0, y: -60 }}
	>
		<SyllableGrid {data} gridSpacing={{ x: 58, y: 31 }} elementBufferSize={20} />
	</DyslexTrackLevel>
{/if}
