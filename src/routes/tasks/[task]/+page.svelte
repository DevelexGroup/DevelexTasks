<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import Icon from '@iconify/svelte';
	import DefaultLayout from '$lib/components/layout/DefaultLayout.svelte';

	let { data }: PageProps = $props();

	const levelStyles = [
		{
			iconWrapClass: 'bg-green-200',
			iconClass: 'text-emerald-900',
			icon: 'material-symbols-light:forest-rounded'
		},
		{
			iconWrapClass: 'bg-blue-200',
			iconClass: 'text-blue-900',
			icon: 'material-symbols-light:waving-hand-rounded'
		},
		{
			iconWrapClass: 'bg-yellow-100',
			iconClass: 'text-yellow-900',
			icon: 'material-symbols-light:lightbulb-rounded'
		},
		{
			iconWrapClass: 'bg-orange-200',
			iconClass: 'text-orange-900',
			icon: 'material-symbols-light:bolt-rounded'
		},
		{
			iconWrapClass: 'bg-red-200',
			iconClass: 'text-red-900',
			icon: 'material-symbols-light:rocket-launch-rounded'
		},
		{
			iconWrapClass: 'bg-violet-200',
			iconClass: 'text-violet-900',
			icon: 'material-symbols-light:military-tech-rounded'
		}
	];
</script>

<DefaultLayout>
	<div>
		<button
			class="inline-flex cursor-pointer items-center space-x-3 rounded-md bg-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-400"
			onclick={() => goto(resolve(data.task.slug == 'dyslex' ? `/` : '/reeducation'))}
		>
			<Icon icon="mdi:arrow-left" class="h-5 w-5" />

			<span>Zpět</span>
		</button>
	</div>

	<h1 class="text-2xl font-black text-gray-800">Úloha: {data.task.label}</h1>

	<div class="grid grid-cols-1 gap-5">
		{#each data.levels as level, index (level.slug)}
			{@const style = levelStyles[index % levelStyles.length]}

			<div
				class="flex items-center justify-between rounded-md border border-transparent bg-indigo-50 px-6 py-4 transition-colors hover:border-blue-600/20"
			>
				<div class="inline-flex items-center space-x-4">
					<div
						class={`inline-flex h-13 w-13 items-center justify-center rounded-md ${style.iconWrapClass}`}
					>
						<Icon icon="mdi:book-open-page-variant" class={`h-6.5 w-6.5 ${style.iconClass}`} />
					</div>

					<span class="text-xl font-bold text-gray-800">{level.label}</span>
				</div>

				<button
					class="cursor-pointer rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-gray-50 hover:bg-blue-700"
					onclick={() => goto(resolve(`/tasks/${data.task.slug}/${level.slug}`))}
				>
					Start
				</button>
			</div>
		{/each}
	</div>
</DefaultLayout>
