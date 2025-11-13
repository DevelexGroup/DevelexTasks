<script lang="ts">
	import TaskWrapper from '$lib/components/TaskWrapper.svelte';
	import type { PageProps } from './$types';
	import type { Component } from 'svelte';

	let { data }: PageProps = $props();

	const modules = import.meta.glob<{ default: Component }>(
		`$lib/components/tasks/**/{Task,Practice,Instructions}.svelte`
	)

	function getComponentPath(filename: string) {
		return `/src/lib/components/tasks/${data.task}/levels/${data.level}/${filename}.svelte`;
	}

	const taskComponentPromise = modules[getComponentPath("Task")]?.()?.then(mod => mod.default) || null;
	const practiceComponentPromise = modules[getComponentPath("Practice")]?.()?.then(mod => mod.default) || null;
	const instructionsComponentPromise = modules[getComponentPath("Instructions")]?.()?.then(mod => mod.default) || null;
</script>

<TaskWrapper>
	<svelte:fragment slot="Task">
	{#if taskComponentPromise}
		{#await taskComponentPromise then TaskComponent}
				<TaskComponent />
		{/await}
	{/if}
	</svelte:fragment>

	<svelte:fragment slot="Practice">
		{#if practiceComponentPromise}
			{#await practiceComponentPromise then PracticeComponent}
				<PracticeComponent />
			{/await}
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="Instructions">
		{#if instructionsComponentPromise}
			{#await instructionsComponentPromise then InstructionsComponent}
				<InstructionsComponent />
			{/await}
		{/if}
	</svelte:fragment>
</TaskWrapper>