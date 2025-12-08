<script lang="ts">
	import { browser } from '$app/environment';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import { getContext, onDestroy, onMount } from 'svelte';
	import TaskTrackerLoader from './TaskTrackerLoader.svelte';
	import TaskEndScreen from '$lib/components/TaskEndScreen.svelte';
	import { ANALYTICS_MANAGER_KEY, GAZE_MANAGER_KEY } from '$lib/types/general.types';
	import type { AnalyticsManager } from '$lib/utils/analyticsManager';
	import { TaskResult } from '$lib/database/db.types';

	const analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);

	taskStage.set(TaskStage.Loading);

	onMount(() => {
		if (!browser) {
			return;
		}
	});

	$effect(() => {
		if ($taskStage === TaskStage.Task) {
			analyticsManager.startLogging();
		}
		if ($taskStage === TaskStage.End) {
			analyticsManager.stopLogging(TaskResult.Natural);
		}
	});

	onDestroy(() => {
		analyticsManager.stopLogging(TaskResult.Death);
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
