<script lang="ts">
	import { resolve } from '$app/paths';
	import Icon from '@iconify/svelte';
	import DefaultLayout from '$lib/components/layout/DefaultLayout.svelte';
	import RoleGuard from '$lib/components/RoleGuard.svelte';
	import { RoleGuards } from '$lib/utils/roleGuard';
	import { isDiagnosisMode } from '$lib/stores/diagnosis';
</script>

<svelte:head>
	<title>DeveLex úlohy</title>
	<meta name="description" content="Various develex tasks" />
</svelte:head>

<DefaultLayout>
	<h1 class="text-2xl font-black text-gray-800">Úlohy</h1>

	<div class="grid grid-cols-2 gap-6">
		<div
			class="relative flex flex-col overflow-hidden rounded-xl bg-white px-6 py-6 shadow-xl shadow-gray-300/50"
		>
			<div class="absolute -top-6 -right-6 h-22 w-22 rounded-full bg-indigo-100/40"></div>

			<div class="inline-flex h-14 w-14 items-center justify-center rounded-md bg-indigo-100">
				<Icon icon="material-symbols:eyeglasses" class="h-7 w-7 text-blue-700" />
			</div>

			<span class="mt-5 text-xl font-bold text-gray-800">Reedukace dyslexie</span>

			<a
				href={resolve('/reeducation')}
				class="group mt-8 inline-flex items-center space-x-2 rounded-md font-bold text-blue-600"
			>
				<span class="group-hover:underline">Hrát nyní</span>

				<Icon icon="mdi:arrow-right" class="h-5 w-5 transition-all group-hover:ml-2" />
			</a>
		</div>

		{#if $isDiagnosisMode}
			<div
				class="relative flex flex-col overflow-hidden rounded-xl bg-white px-6 py-6 shadow-xl shadow-gray-300/50"
			>
				<div class="absolute -top-6 -right-6 h-22 w-22 rounded-full bg-emerald-100/40"></div>

				<div class="inline-flex h-14 w-14 items-center justify-center rounded-md bg-emerald-100">
					<Icon
						icon="material-symbols:eye-tracking-outline-rounded"
						class="h-7 w-7 text-emerald-700"
					/>
				</div>

				<span class="mt-5 text-xl font-bold text-gray-800">Diagnostika dyslexie</span>

				<a
					href={resolve('/tasks/dyslex')}
					class="group mt-8 inline-flex items-center space-x-2 rounded-md font-bold text-emerald-600"
				>
					<span class="group-hover:underline">Hrát nyní</span>

					<Icon icon="mdi:arrow-right" class="h-5 w-5 transition-all group-hover:ml-2" />
				</a>
			</div>

			<div
				class="relative flex flex-col overflow-hidden rounded-xl bg-white px-6 py-6 shadow-xl shadow-gray-300/50"
			>
				<div class="absolute -top-6 -right-6 h-22 w-22 rounded-full bg-amber-100/40"></div>

				<div class="inline-flex h-14 w-14 items-center justify-center rounded-md bg-amber-100">
					<Icon
						icon="material-symbols:assignment-outline-rounded"
						class="h-7 w-7 text-amber-700"
					/>
				</div>

				<span class="mt-5 text-xl font-bold text-gray-800">Evaluace reedukace dyslexie</span>

				<a
					href={resolve('/evaluation')}
					class="group mt-8 inline-flex items-center space-x-2 rounded-md font-bold text-amber-600"
				>
					<span class="group-hover:underline">Hrát nyní</span>

					<Icon icon="mdi:arrow-right" class="h-5 w-5 transition-all group-hover:ml-2" />
				</a>
			</div>

			<div
				class="relative flex flex-col overflow-hidden rounded-xl bg-white px-6 py-6 shadow-xl shadow-gray-300/50"
			>
				<div class="absolute -top-6 -right-6 h-22 w-22 rounded-full bg-cyan-100/40"></div>

				<div class="inline-flex h-14 w-14 items-center justify-center rounded-md bg-cyan-100">
					<Icon
						icon="material-symbols:chair"
						class="h-7 w-7 text-cyan-700"
					/>
				</div>

				<span class="mt-5 text-xl font-bold text-gray-800">Intervenční sezení</span>

				<a
					href={resolve('/intervention')}
					class="group mt-8 inline-flex items-center space-x-2 rounded-md font-bold text-cyan-600"
				>
					<span class="group-hover:underline">Hrát nyní</span>

					<Icon icon="mdi:arrow-right" class="h-5 w-5 transition-all group-hover:ml-2" />
				</a>
			</div>
		{/if}

	</div>

	<RoleGuard config={RoleGuards.garantOnly}>
		<h2 class="text-2xl font-black text-gray-800 mt-8">Administrace</h2>

		<div class="flex flex-wrap gap-6">
			<a
				href={resolve('/admin/session-files')}
				class="group relative flex w-44 flex-col overflow-hidden rounded-xl bg-white p-5 shadow-xl shadow-gray-300/50 transition-shadow hover:shadow-2xl"
			>
				<div class="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-violet-100/40"></div>

				<div class="inline-flex h-12 w-12 items-center justify-center rounded-md bg-violet-100">
					<Icon icon="material-symbols:folder-zip" class="h-6 w-6 text-violet-700" />
				</div>

				<span class="mt-4 text-sm font-bold text-gray-800 group-hover:underline">
					Session soubory
				</span>
			</a>

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
					Heatmapa
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
		</div>
	</RoleGuard>
</DefaultLayout>
