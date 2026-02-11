<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as Dialog from '$lib/components/ui/dialog';
	import { db } from '$lib/database/db';

	let isDeleteDialogOpen = $state(false);
	let isDeleting = $state(false);

	async function deleteAllData() {
		isDeleting = true;
		try {
			await db.delete();
			await db.open();
			isDeleteDialogOpen = false;
		} finally {
			isDeleting = false;
		}
	}
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

		<button
			class="rounded-md bg-blue-500 px-3 py-1.5 text-gray-50 hover:bg-blue-600"
			onclick={() => goto(resolve(`/admin/heatmap`))}
		>
			Heatmap
		</button>

		<button
			class="rounded-md bg-blue-500 px-3 py-1.5 text-gray-50 hover:bg-blue-600"
			onclick={() => goto(resolve(`/admin/user-management`))}
		>
			User management
		</button>

		<hr class="my-4 border-gray-300" />

		<button
			class="rounded-md bg-red-500 px-3 py-1.5 text-gray-50 hover:bg-red-600"
			onclick={() => (isDeleteDialogOpen = true)}
		>
			Smazat všechna data
		</button>
	</div>

	<div class="absolute bottom-4 left-4">
		<button
			class="rounded-md bg-gray-300 px-3 py-1.5 text-gray-800"
			onclick={() => goto(resolve(`/`))}
		>
			Zpět
		</button>
	</div>
</section>

<Dialog.Root bind:open={isDeleteDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Smazat všechna data</Dialog.Title>
			<Dialog.Description>
				Opravdu chcete smazat všechna lokálně uložená data? Tato akce je nevratná.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<button
				class="rounded-md bg-gray-300 px-3 py-1.5 text-gray-800 hover:bg-gray-400"
				onclick={() => (isDeleteDialogOpen = false)}
				disabled={isDeleting}
			>
				Zrušit
			</button>
			<button
				class="rounded-md bg-red-500 px-3 py-1.5 text-gray-50 hover:bg-red-600 disabled:bg-red-300"
				onclick={deleteAllData}
				disabled={isDeleting}
			>
				{isDeleting ? 'Mažu...' : 'Smazat'}
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
