<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { RoleGuards } from '$lib/utils/roleGuard';
	import Icon from '@iconify/svelte';
	import RoleGuard from '../RoleGuard.svelte';
	import UserSelect from '../UserSelect.svelte';
	import { validateAuthStatus } from '$lib/api/auth';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		validateAuthStatus();
	});
</script>

<main class="flex h-screen flex-col bg-gray-50 font-lexend">
	<nav class="flex w-full bg-white px-4 py-4 shadow-xl">
		<div class="mx-auto flex w-full max-w-5xl items-center justify-between">
			<span class="text-2xl font-black text-blue-600">Develex</span>

			<div class="inline-flex items-center space-x-3">
				<button
					class="inline-flex cursor-pointer items-center rounded-md bg-blue-100 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-blue-200"
					onclick={() => goto(resolve('/settings'))}
				>
					<Icon icon="material-symbols:settings" class="mr-2 h-4.5 w-4.5" />

					Nastavení
				</button>

				<RoleGuard config={RoleGuards.garantOnly}>
					<button
						class="fixed right-4 bottom-4 rounded-md bg-purple-500 px-3 py-1.5 text-gray-50 hover:bg-purple-600"
						onclick={() => goto(resolve('/admin'))}
					>
						Administrace
					</button>
				</RoleGuard>

				<UserSelect />
			</div>
		</div>
	</nav>

	<section class="mt-4 flex h-full w-full px-4 py-6">
		<div class="mx-auto flex w-full max-w-5xl flex-col gap-6">
			{@render children()}
		</div>
	</section>
</main>
