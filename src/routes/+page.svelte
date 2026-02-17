<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import UserSelect from '$lib/components/UserSelect.svelte';
	import RoleGuard from '$lib/components/RoleGuard.svelte';
	import { RoleGuards } from '$lib/utils/roleGuard';

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

	<RoleGuard config={RoleGuards.garantOnly}>
		<button
			class="fixed right-4 bottom-4 rounded-md bg-purple-500 px-3 py-1.5 text-gray-50 hover:bg-purple-600"
			onclick={() => goto(resolve('/admin'))}
		>
			Administrace
		</button>
	</RoleGuard>

	<div class="mt-3">
		<UserSelect />
	</div>
</section>
