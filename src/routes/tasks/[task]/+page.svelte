<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();
</script>

<section class="mt-8 flex flex-col items-center justify-center">
	<h1 class="text-5xl font-bold text-red-400">Develex Tasks</h1>

	<div class="mt-12 flex flex-col gap-2">
		<h2>{data.task.label}</h2>

		{#each data.levels as level (level)}
			<button
				class="rounded-md bg-blue-500 px-3 py-1.5 text-gray-50 hover:bg-blue-600"
				onclick={() => goto(resolve(`/tasks/${data.task.slug}/${level}`))}
			>
				level: {level}
			</button>
		{/each}
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
