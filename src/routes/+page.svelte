<script lang="ts">
	import { resolve } from '$app/paths';
	import Icon from '@iconify/svelte';
	import DefaultLayout from '$lib/components/layout/DefaultLayout.svelte';
</script>

<svelte:head>
	<title>Develex úlohy</title>
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
	</div>
</DefaultLayout>
