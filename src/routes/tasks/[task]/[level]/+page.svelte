<script lang="ts">
	import TaskWrapper from '$lib/components/TaskWrapper.svelte';
	import type { PageProps } from './$types';
	import { type Component, getContext, onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { currentTask } from '$lib/stores/task';
	import { AnalyticsManager } from '$lib/utils/analyticsManager';
	import { ANALYTICS_MANAGER_KEY } from '$lib/types/general.types';

	let { data }: PageProps = $props();

	const modules = import.meta.glob<{ default: Component }>(
		`$lib/components/tasks/**/{Task,Practice,Instructions}.svelte`
	);

	function getComponentPath(filename: string) {
		return `/src/lib/components/tasks/${data.task}/levels/${data.level}/${filename}.svelte`;
	}

	const taskComponentPromise =
		modules[getComponentPath('Task')]?.()?.then((mod) => mod.default) || null;
	const practiceComponentPromise =
		modules[getComponentPath('Practice')]?.()?.then((mod) => mod.default) || null;
	const instructionsComponentPromise =
		modules[getComponentPath('Instructions')]?.()?.then((mod) => mod.default) || null;

	onMount(() => {
		$currentTask = {
			slug: data.task,
			level: data.level,
			sessionId: Date.now().toString(),
			stimulusId: 'null',
			currentSlideIndex: -1,
			result: null
		};
	});

	onDestroy(() => {
		$currentTask = null;
	});
</script>

<TaskWrapper>
	<svelte:fragment slot="Task">
		{#if taskComponentPromise}
			{#await taskComponentPromise then TaskComponent}
				<TaskComponent />
			{:catch error}
				<p>Error loading Task component: {error.message}</p>
			{/await}
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="Practice">
		{#if practiceComponentPromise}
			{#await practiceComponentPromise then PracticeComponent}
				<PracticeComponent />
			{:catch error}
				<p>Error loading Practice component: {error.message}</p>
			{/await}
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="Instructions">
		{#if instructionsComponentPromise}
			{#await instructionsComponentPromise then InstructionsComponent}
				<InstructionsComponent />
			{:catch error}
				<p>Error loading Instructions component: {error.message}</p>
			{/await}
			<div class="absolute bottom-4 left-4">
				<button
					class="rounded-md bg-gray-300 px-3 py-1.5 text-gray-800"
					onclick={() => goto(resolve(`/tasks/${data.task}`))}
				>
					Zpět
				</button>
			</div>
		{/if}
	</svelte:fragment>
</TaskWrapper>
