<script lang="ts">
	import type { PageProps } from '../../../.svelte-kit/types/src/routes/admin/$types';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Admin - Develex Tasks</title>
	<meta name="description" content="Admin page for Develex Tasks" />
</svelte:head>

<section class="mt-8 flex flex-col items-center justify-center">
	<h1 class="text-5xl font-bold text-red-400">Develex Tasks</h1>

	<div class="mt-12 flex flex-col gap-2">
		<h2>Admin Panel</h2>

		<button
			class="rounded-md bg-blue-500 px-3 py-1.5 text-gray-50 hover:bg-blue-600"
			onclick={() => goto(resolve(`/admin/database`))}
		>
			Databáze
		</button>
	</div>

	<div class="absolute bottom-4 left-4">
		<button
			class="px-3 py-1.5 bg-gray-300 text-gray-800 rounded-md"
			onclick={() => goto(resolve(`/`))}
		>
			Zpět
		</button>
	</div>
</section>