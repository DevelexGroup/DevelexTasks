<script lang="ts">
	import { browser } from '$app/environment';
	import { currentTask, taskStage } from '$lib/stores/task';
	import { TaskResult, TaskStage } from '$lib/types/task.types';
	import { getContext, onDestroy, onMount } from 'svelte';
	import TaskTrackerLoader from './TaskTrackerLoader.svelte';
	import TaskEndScreen from '$lib/components/TaskEndScreen.svelte';
	import {
		ANALYTICS_MANAGER_KEY,
		GAZE_MANAGER_KEY,
		KEYBOARD_MANAGER_KEY
	} from '$lib/types/general.types';
	import type { AnalyticsManager } from '$lib/utils/analyticsManager';
	import { showDialog } from '$lib/stores/dialog';
	import DialogPopup from '$lib/components/DialogPopup.svelte';
	import { KeyboardManager } from '$lib/utils/keyboardManager';
	import { GazeManager } from 'develex-js-sdk';
	import TestSessionHandler from '$lib/components/TestSessionHandler.svelte';

	const DEFAULT_TIMEOUT_INTERVAL = 80000; // 80 seconds
	const TIMEOUT_EVENT_LOG = 'inactivity_timeout';

	const gazeManager = getContext<GazeManager>(GAZE_MANAGER_KEY);
	const analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);
	const keyboardManager = getContext<KeyboardManager>(KEYBOARD_MANAGER_KEY);

	taskStage.set(TaskStage.Loading);

	let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

	onMount(() => {
		if (!browser) return;

		window.addEventListener('mousemove', resetTimeoutOnInteraction);
		window.addEventListener('mouseup', resetTimeoutOnInteraction);
		window.addEventListener('keydown', resetTimeoutOnInteraction);
	});

	onDestroy(() => {
		if (!browser) return;

		window.removeEventListener('mousemove', resetTimeoutOnInteraction);
		window.removeEventListener('mouseup', resetTimeoutOnInteraction);
		window.removeEventListener('keydown', resetTimeoutOnInteraction);

		if (gazeManager.input) {
			gazeManager.stop();
			gazeManager.disconnect();
			gazeManager.close();
		}

		// Clear timeout if exists
		if (timeoutHandle) {
			clearTimeout(timeoutHandle);
		}
	});

	function exitTask(taskResult: TaskResult) {
		currentTask.update((task) => {
			if (task) {
				console.log('Setting task result to', taskResult);
				task.result = taskResult;
			}
			return task;
		});
		taskStage.set(TaskStage.End);
	}

	function showPauseDialog(pauseFromTimeout: boolean) {
		analyticsManager.pauseLogging();
		showDialog({
			title: pauseFromTimeout ? 'Úloha pozastavena' : 'Odejít z úlohy?',
			description: pauseFromTimeout
				? 'Úloha byla pozastavena kvůli delší neaktivitě. Chcete v úloze pokračovat, nebo se vrátit do menu?'
				: 'Úloha zapauzována. Jste si jistí, že chcete odejít z úlohy?',
			options: [
				{
					label: 'Odejít',
					variant: 'destructive',
					callback: () => exitTask(pauseFromTimeout ? TaskResult.Timeout : TaskResult.Escape),
					closeOnClick: true
				},
				{
					label: 'Zůstat',
					variant: 'secondary',
					callback: () => {
						startTimeout();
					},
					closeOnClick: true
				}
			]
		}).then(() => {
			analyticsManager.resumeLogging();
		});
	}

	keyboardManager.onKeyDown('Escape', () => {
		if ($taskStage === TaskStage.Task || $taskStage === TaskStage.Practice) {
			showPauseDialog(false);
		}
	});

	const startTimeout = () => {
		if (timeoutHandle) {
			clearTimeout(timeoutHandle);
		}
		timeoutHandle = setTimeout(() => {
			if ($taskStage === TaskStage.Task || $taskStage === TaskStage.Practice) {
				analyticsManager.logEvent(TIMEOUT_EVENT_LOG);
				showPauseDialog(true);
			}
		}, DEFAULT_TIMEOUT_INTERVAL);
	};

	let throttleHandle: ReturnType<typeof setTimeout> | null = null;
	const resetTimeoutOnInteraction = () => {
		if ($taskStage !== TaskStage.Practice && $taskStage !== TaskStage.Task) return;
		if (throttleHandle) return;

		throttleHandle = setTimeout(() => {
			throttleHandle = null;
		}, 1000);
		startTimeout();
	};

	$effect(() => {
		if ($taskStage === TaskStage.Practice || $taskStage === TaskStage.Task) {
			startTimeout();
		} else {
			if (timeoutHandle) {
				clearTimeout(timeoutHandle);
			}
		}
	});
</script>

<div class="h-screen w-screen overflow-hidden">
	{#if $taskStage === TaskStage.Loading}
		<TaskTrackerLoader onCompleted={() => taskStage.set(TaskStage.Instructions)} />
	{:else if $taskStage === TaskStage.Instructions}
		<slot name="Instructions" />
	{:else if $taskStage === TaskStage.Practice}
		<slot name="Practice" />
	{:else if $taskStage === TaskStage.Task}
		<slot name="Task" />
	{:else if $taskStage === TaskStage.End}
		<TaskEndScreen exitType={$currentTask?.result ?? TaskResult.Terminate} />
	{/if}
</div>

<DialogPopup />
<TestSessionHandler />
