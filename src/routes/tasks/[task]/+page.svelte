<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import { validateAuthStatus } from '$lib/api/auth';

	let { data }: PageProps = $props();

	onMount(() => {
		// Sanity check: validate auth status with the server
		validateAuthStatus();
	});
</script>

<section class="flex h-screen flex-col items-center justify-center pb-8">
	<h1 class="text-5xl font-bold text-red-400">{data.task.label}</h1>

	<div class="mt-12 flex flex-col gap-2">
		{#each data.levels as level (level.slug)}
			<button
				class="rounded-md bg-blue-500 px-3 py-1.5 text-gray-50 hover:bg-blue-600"
				onclick={() => goto(resolve(`/tasks/${data.task.slug}/${level.slug}`))}
			>
				{level.label}
			</button>
		{/each}
	</div>

	<div class="absolute bottom-4 left-4">
		<button
			class="rounded-md bg-gray-300 px-3 py-1.5 text-gray-800"
			onclick={() => goto(resolve(data.task.slug == 'dyslex' ? `/` : '/reeducation'))}
		>
			Zpět
		</button>
	</div>
</section>
