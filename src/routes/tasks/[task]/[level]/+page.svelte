<script lang="ts">
	import TaskWrapper from '$lib/components/TaskWrapper.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const CoreComponent = import(
		'/src/lib/components/tasks/' + data.task + '/levels/' + data.level + '/Core.svelte'
	).then((mod) => mod.default);
</script>

<TaskWrapper>
	{#if CoreComponent}
		{#await CoreComponent then Component}
			<Component />
		{/await}
	{/if}
</TaskWrapper>
