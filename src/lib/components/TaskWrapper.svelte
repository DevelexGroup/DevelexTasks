<script lang="ts">
	import { browser } from '$app/environment';
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';
	import type { GazeDataPoint, GazeManager } from 'develex-js-sdk';
	import { getContext, onMount } from 'svelte';
	import TaskTrackerLoader from './TaskTrackerLoader.svelte';
	import TaskEndScreen from '$lib/components/TaskEndScreen.svelte';

	const gazeManager = getContext<GazeManager>('gazeManager');

	taskState.set(TaskState.Loading);

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

{#if $taskState === TaskState.Loading}
	<TaskTrackerLoader onCompleted={() => taskState.set(TaskState.Instructions)} />
{:else if $taskState === TaskState.Instructions}
	<slot name="Instructions" />
{:else if $taskState === TaskState.Practice}
	<slot name="Practice" />
{:else if $taskState === TaskState.Task}
	<slot name="Task" />
{:else if $taskState === TaskState.End}
	<TaskEndScreen />
{/if}
