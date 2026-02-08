<script lang="ts">
	import { id } from '$lib/components/tasks/dyslex/levels/4_visdiff_1/index';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import { playSound } from '$lib/utils/sound';
	import DyslexTrackLevel from '../../components/DyslexTrackLevel.svelte';
	import VisDiffGrid from '../../components/VisDiffGrid.svelte';
	import { visdiffData } from '../../dyslex.data';

	const data = visdiffData['practice'];

	const handleOnClick = (item: number) => {
		playSound(`/sound/dyslex_ding.wav`);
	};
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
		offset={{ x: 0, y: -40 }}
	>
		<VisDiffGrid
			data={data[0]}
			slide={0}
			isPractice={true}
			border={{ outer: 4, inner: 2 }}
			onClick={handleOnClick}
		/>
	</DyslexTrackLevel>
{/if}
