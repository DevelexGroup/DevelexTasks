<script lang="ts">
	import { id } from '$lib/components/tasks/dyslex/levels/4_visdiff_1/index';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import DyslexTrackLevel from '../../components/DyslexTrackLevel.svelte';
	import VisDiffGrid from '../../components/VisDiffGrid.svelte';
	import { visdiffData } from '../../dyslex.data';

	const data = visdiffData['content'];
	let slide = $state(0);
</script>

{#if data}
	<DyslexTrackLevel
		{id}
		repetitions={1}
		validateStage={() => true}
		isPractice={false}
		onCompleted={() => {
			if (slide < data.length - 1) {
				slide++;
			} else {
				taskStage.set(TaskStage.End);
			}
		}}
		offset={{ x: 0, y: 0 }}
	>
		<VisDiffGrid data={data[slide]} {slide} isPractice={false} border={{ outer: 2, inner: 1 }} />
	</DyslexTrackLevel>
{/if}
