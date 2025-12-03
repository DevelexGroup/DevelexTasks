<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import UserSelect from '$lib/components/UserSelect.svelte';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Develex Tasks</title>
	<meta name="description" content="Various develex tasks" />
</svelte:head>

<section class="mt-8 flex flex-col items-center justify-center">
	<h1 class="text-5xl font-bold text-red-400">Develex Tasks</h1>

	<div class="mt-12 flex flex-col gap-2">
		{#each data.tasks as task (task.slug)}
			<button
				class="rounded-md bg-blue-500 px-3 py-1.5 text-gray-50 hover:bg-blue-600"
				onclick={() => goto(resolve(`/tasks/${task.slug}`))}
			>
				Task: {task.label}
			</button>
		{/each}
	</div>

	<div class="mt-12 flex flex-col gap-2">
		<button
			class="rounded-md bg-blue-500 px-3 py-1.5 text-gray-50 hover:bg-blue-600"
			onclick={() => goto(resolve('/settings'))}
		>
			Nastavení
		</button>
	</div>
</section>

<UserSelect />
