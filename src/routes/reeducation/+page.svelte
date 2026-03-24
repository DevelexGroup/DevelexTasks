<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import UserSelect from '$lib/components/UserSelect.svelte';
	import RoleGuard from '$lib/components/RoleGuard.svelte';
	import { RoleGuards } from '$lib/utils/roleGuard';
	import { validateAuthStatus } from '$lib/api/auth';

	let { data }: PageProps = $props();

	onMount(() => {
		// Sanity check: validate auth status with the server
		validateAuthStatus();
	});
</script>

<svelte:head>
	<title>Reedukace dyslexie</title>
	<meta name="description" content="Various develex tasks" />
</svelte:head>

<section class="flex h-screen flex-col items-center justify-center pb-8">
	<h1 class="text-5xl font-bold text-red-400">Reedukace dyslexie</h1>

	<div class="mt-12 flex flex-col gap-2">
		{#each data.tasks as task (task.slug)}
			<button
				class="rounded-md bg-blue-500 px-3 py-1.5 text-gray-50 hover:bg-blue-600"
				onclick={() => goto(resolve(`/tasks/${task.slug}`))}
			>
				{task.label}
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

	<div class="absolute bottom-4 left-4">
		<button
			class="rounded-md bg-gray-300 px-3 py-1.5 text-gray-800"
			onclick={() => goto(resolve(`/`))}
		>
			Zpět do hlavní nabídky
		</button>
	</div>
</section>
