<script lang="ts">
	import { resolve } from '$app/paths';
	import Icon from '@iconify/svelte';
	import DefaultLayout from '$lib/components/layout/DefaultLayout.svelte';
</script>

<svelte:head>
	<title>Admin - Develex Tasks</title>
	<meta name="description" content="Admin page for Develex Tasks" />
</svelte:head>

<DefaultLayout>
	<h1 class="text-2xl font-black text-gray-800">Administrace</h1>

	<div class="flex flex-wrap gap-6">
		<a
			href={resolve('/admin/database')}
			class="group relative flex w-44 flex-col overflow-hidden rounded-xl bg-white p-5 shadow-xl shadow-gray-300/50 transition-shadow hover:shadow-2xl"
		>
			<div class="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-sky-100/40"></div>

			<div class="inline-flex h-12 w-12 items-center justify-center rounded-md bg-sky-100">
				<Icon icon="material-symbols:database" class="h-6 w-6 text-sky-700" />
			</div>

			<span class="mt-4 text-sm font-bold text-gray-800 group-hover:underline">
				Lokální databáze
			</span>
		</a>

		<a
			href={resolve('/admin/heatmap')}
			class="group relative flex w-44 flex-col overflow-hidden rounded-xl bg-white p-5 shadow-xl shadow-gray-300/50 transition-shadow hover:shadow-2xl"
		>
			<div class="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-orange-100/40"></div>

			<div class="inline-flex h-12 w-12 items-center justify-center rounded-md bg-orange-100">
				<Icon icon="material-symbols:mode-heat" class="h-6 w-6 text-orange-700" />
			</div>

			<span class="mt-4 text-sm font-bold text-gray-800 group-hover:underline">
				Heatmap
			</span>
		</a>

		<a
			href={resolve('/admin/user-management')}
			class="group relative flex w-44 flex-col overflow-hidden rounded-xl bg-white p-5 shadow-xl shadow-gray-300/50 transition-shadow hover:shadow-2xl"
		>
			<div class="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-teal-100/40"></div>

			<div class="inline-flex h-12 w-12 items-center justify-center rounded-md bg-teal-100">
				<Icon icon="material-symbols:group" class="h-6 w-6 text-teal-700" />
			</div>

			<span class="mt-4 text-sm font-bold text-gray-800 group-hover:underline">
				Správa uživatelů
			</span>
		</a>

		<a
			href={resolve('/admin/session-files')}
			class="group relative flex w-44 flex-col overflow-hidden rounded-xl bg-white p-5 shadow-xl shadow-gray-300/50 transition-shadow hover:shadow-2xl"
		>
			<div class="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-violet-100/40"></div>

			<div class="inline-flex h-12 w-12 items-center justify-center rounded-md bg-violet-100">
				<Icon icon="material-symbols:folder-zip" class="h-6 w-6 text-violet-700" />
			</div>

			<span class="mt-4 text-sm font-bold text-gray-800 group-hover:underline">
				Soubory sezení
			</span>
		</a>
	</div>
</DefaultLayout>
