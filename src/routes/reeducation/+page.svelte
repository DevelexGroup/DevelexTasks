<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import DefaultLayout from '$lib/components/layout/DefaultLayout.svelte';
	import Icon from '@iconify/svelte';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Reedukace dyslexie</title>
	<meta name="description" content="Various develex tasks" />
</svelte:head>

<DefaultLayout>
	<div>
		<button
			class="inline-flex cursor-pointer items-center space-x-3 rounded-md bg-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-400"
			onclick={() => goto(resolve(`/`))}
		>
			<Icon icon="mdi:arrow-left" class="h-5 w-5" />

			<span>Zpět do hlavní nabídky</span>
		</button>
	</div>

	<h1 class="text-2xl font-black text-gray-800">Reedukace dyslexie</h1>

	<div class="grid grid-cols-1 gap-5">
		{#each data.tasks as task (task.slug)}
			<div
				class="flex items-center justify-between rounded-md border border-transparent bg-indigo-50 px-6 py-4 transition-colors hover:border-blue-600/20"
			>
				<div class="inline-flex items-center space-x-4">
					<div class="inline-flex h-13 w-13 items-center justify-center rounded-md bg-emerald-200">
						<Icon
							icon="material-symbols-light:book-ribbon-rounded"
							class="h-7.5 w-7.5 text-green-900"
						/>
					</div>

					<span class="text-xl font-bold text-gray-800">{task.label}</span>
				</div>

				<button
					class="cursor-pointer rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-gray-50 hover:bg-blue-700"
					onclick={() => goto(resolve(`/tasks/${task.slug}`))}
				>
					Start
				</button>
			</div>
		{/each}
	</div>
</DefaultLayout>
