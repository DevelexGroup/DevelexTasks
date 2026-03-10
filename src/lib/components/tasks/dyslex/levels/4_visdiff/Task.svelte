<script lang="ts">
	import { id } from '$lib/components/tasks/dyslex/levels/4_visdiff/index';
	import { taskStage, currentTask } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import { playSound } from '$lib/utils/sound';
	import DyslexTrackLevel from '../../components/DyslexTrackLevel.svelte';
	import VisDiffGrid from '../../components/VisDiffGrid.svelte';
	import { visdiffData } from '../../dyslex.data';
	import { getContext } from 'svelte';
	import { ANALYTICS_MANAGER_KEY } from '$lib/types/general.types';
	import type { AnalyticsManager } from '$lib/utils/analyticsManager';
	import { db } from '$lib/database/db';
	import { authUser } from '$lib/stores/auth';
	import { get } from 'svelte/store';

	const data = visdiffData['content'];
	let slide = $state(0);

	const analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);

	const handleOnClick = async (item: number, aoi: string, isCorrect: boolean) => {
		playSound(`/sound/dyslex_ding.wav`);

		analyticsManager.logEvent(`visdiff-click-${item}`);

		const user = get(authUser);
		const task = get(currentTask);

		await db.dyslexVissDiffClicks
			.add({
				child_id: user?.username ?? 'host',
				session_id: task?.sessionId ?? 'unknown',
				task_name: task ? `${task.slug}-${task.level}` : 'unknown',
				slide_index: task?.currentSlideIndex ?? -1,
				stimulus_id: task?.stimulusId ?? 'null',
				timestamp: window.performance.timeOrigin + window.performance.now(),
				is_correct: isCorrect,
				aoi: aoi
			})
			.catch((error) => {
				console.error('Error logging visdiff click:', error);
			});
	};
</script>

{#if data}
	<DyslexTrackLevel
		{id}
		repetitions={2}
		onNextStage={() => {
			if (slide < data.length - 1) {
				slide++;
			}
		}}
		onCompleted={() => {
			taskStage.set(TaskStage.End);
		}}
		offset={{ x: 0, y: 0 }}
	>
		<VisDiffGrid
			data={data[slide]}
			{slide}
			isPractice={false}
			border={{ outer: 2, inner: 1 }}
			onClick={handleOnClick}
		/>
	</DyslexTrackLevel>
{/if}
