<script lang="ts">
	import { browser } from '$app/environment';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import { getContext, onDestroy, onMount } from 'svelte';
	import TaskTrackerLoader from './TaskTrackerLoader.svelte';
	import TaskEndScreen from '$lib/components/TaskEndScreen.svelte';
	import { ANALYTICS_MANAGER_KEY, KEYBOARD_MANAGER_KEY } from '$lib/types/general.types';
	import type { AnalyticsManager } from '$lib/utils/analyticsManager';
	import { TaskResult } from '$lib/database/db.types';
	import { closeDialog, dialog, showDialog } from '$lib/stores/dialog';
	import DialogPopup from '$lib/components/DialogPopup.svelte';
	import { KeyboardManager } from '$lib/utils/keyboardManager';

	const analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);
	const keyboardManager = getContext<KeyboardManager>(KEYBOARD_MANAGER_KEY);

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
		analyticsManager.stopLogging(TaskResult.Terminate);
	});

	function exitTask() {
		analyticsManager.stopLogging(TaskResult.Escape);
		taskStage.set(TaskStage.Instructions);
	}

	keyboardManager.onKeyDown('Escape', () => {
		if ($taskStage === TaskStage.Task || $taskStage === TaskStage.Practice) {
			showDialog({
				title: 'Odejít z úlohy?',
				description: 'Jste si jistí, že chcete odejít z úlohy?',
				options: [
					{ label: "Odejít", variant: 'destructive', callback: exitTask, closeOnClick: true },
					{ label: "Zůstat", variant: 'secondary', callback: () => {}, closeOnClick: true }
				]
			});
		}
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

<DialogPopup />