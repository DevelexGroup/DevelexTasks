<script lang="ts">
	import { browser } from '$app/environment';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import type { GazeDataPoint, GazeManager } from 'develex-js-sdk';
	import { getContext, onMount } from 'svelte';
	import TaskTrackerLoader from './TaskTrackerLoader.svelte';
	import TaskEndScreen from '$lib/components/TaskEndScreen.svelte';

	const gazeManager = getContext<GazeManager>('gazeManager');

	taskStage.set(TaskStage.Loading);

	const handleGazeData = (gazeData: GazeDataPoint) => {
		// console.log(gazeData);
	};

	onMount(() => {
		if (!browser) {
			return;
		}

		gazeManager.on('inputData', handleGazeData);

		return () => {
			gazeManager.off('inputData', handleGazeData);
		};
	});
</script>

{#if $taskStage === TaskStage.Loading}
	<TaskTrackerLoader onCompleted={() => taskStage.set(TaskStage.Instructions)} />
{:else if $taskStage === TaskStage.Instructions}
	<slot name="Instructions" />
{:else if $taskStage === TaskStage.Practice}
	<slot name="Practice" />
{:else if $taskStage === TaskStage.Task}
	<slot name="Task" />
{:else if $taskStage === TaskStage.End}
	<TaskEndScreen />
{/if}
