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
	import { showDialog } from '$lib/stores/dialog';
	import DialogPopup from '$lib/components/DialogPopup.svelte';
	import { KeyboardManager } from '$lib/utils/keyboardManager';

	const DEFAULT_TIMEOUT_INTERVAL = 80000; // 80 seconds
	const TIMEOUT_EVENT_LOG = 'inactivity_timeout';

	const analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);
	const keyboardManager = getContext<KeyboardManager>(KEYBOARD_MANAGER_KEY);

	taskStage.set(TaskStage.Loading);

	onMount(() => {
		if (!browser) return;

		window.addEventListener('mousemove', resetTimeoutOnInteraction);
		window.addEventListener('mouseup', resetTimeoutOnInteraction);
		window.addEventListener('keydown', resetTimeoutOnInteraction);
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

		window.removeEventListener('mousemove', resetTimeoutOnInteraction);
		window.removeEventListener('mouseup', resetTimeoutOnInteraction);
		window.removeEventListener('keydown', resetTimeoutOnInteraction);
	});

	function exitTask(fromTimeout: boolean) {
		analyticsManager.stopLogging(fromTimeout ? TaskResult.Timeout : TaskResult.Escape);
		taskStage.set(TaskStage.Instructions);
	}

	function showPauseDialog(pauseFromTimeout: boolean) {
		analyticsManager.pauseLogging();
		showDialog({
			title: pauseFromTimeout
				? 'Úloha pozastavena'
				: 'Odejít z úlohy?',
			description: pauseFromTimeout
				? 'Úloha byla pozastavena kvůli delší neaktivitě. Chcete v úloze pokračovat, nebo se vrátit do menu?'
				: 'Úloha zapauzována. Jste si jistí, že chcete odejít z úlohy?',
			options: [
				{ label: "Odejít", variant: 'destructive', callback: () => exitTask(pauseFromTimeout), closeOnClick: true },
				{ label: "Zůstat", variant: 'secondary', callback: () => {startTimeout()}, closeOnClick: true }
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

	let timeoutHandle: ReturnType<typeof setTimeout>;
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
	}

	let throttleHandle: ReturnType<typeof setTimeout> | null = null;
	const resetTimeoutOnInteraction = () => {
		if ($taskStage !== TaskStage.Practice && $taskStage !== TaskStage.Task)	return;
		if (throttleHandle) return;

		throttleHandle = setTimeout(() => {
			throttleHandle = null;
		}, 1000);
		startTimeout();
	}

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