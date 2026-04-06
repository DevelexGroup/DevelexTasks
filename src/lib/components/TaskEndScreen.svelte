<script lang="ts">
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { TaskResult } from '$lib/types/task.types';
	import { currentTask } from '$lib/stores/task';

	interface Props {
		exitType: TaskResult;
	}

	let { exitType }: Props = $props();

	const modeQuery = $derived(
		page.url.searchParams.get('mode') === 'evaluation' ? '?mode=evaluation' : ''
	);
	const isSuccessful = $derived(exitType === TaskResult.Natural);
	const status = $derived(
		isSuccessful
			? {
					label: 'Dokončeno',
					title: 'Lekce úspěšně dokončena!',
					description: 'Výsledek je uložený.',
					badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
					panelClass: 'border-gray-200 bg-white/95',
					accent: 'text-gray-500',
					buttonPrimary: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-300',
					buttonSecondary: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
				}
			: {
					label: 'Přerušeno',
					title: 'Lekce byla přerušena.',
					description: 'Můžete pokračovat později.',
					badgeClass: 'border-orange-200 bg-orange-50 text-orange-400',
					panelClass: 'border-gray-200 bg-white/95',
					accent: 'text-gray-500',
					buttonPrimary: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-300',
					buttonSecondary: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
				}
	);

	$effect(() => {
		console.log('Task ended with exit type:', exitType);
	});

	function navigateToTaskList() {
		const taskSlug = page.params.task || $currentTask?.slug;

		if (taskSlug) {
			goto(resolve(`/tasks/${taskSlug}${modeQuery}`));
			return;
		}

		goto(
			resolve(page.url.searchParams.get('mode') === 'evaluation' ? '/evaluation' : '/reeducation')
		);
	}

	function retryTask() {
		navigateToTaskList();
	}
</script>

<div
	in:fade={{ duration: 250 }}
	class="relative flex h-screen w-full items-center justify-center overflow-hidden bg-gray-100 px-4"
>
	<div class="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-white/40 blur-3xl"></div>
	<div class="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-white/30 blur-3xl"></div>

	<section
		class={`relative w-full max-w-xl overflow-hidden rounded-md border px-6 py-7 shadow-lg shadow-gray-300/30 sm:px-8 sm:py-8 ${status.panelClass}`}
	>
		<div class="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-white/35"></div>
		<div class="absolute -bottom-14 -left-10 h-36 w-36 rounded-full bg-white/25"></div>

		<div class="relative flex flex-col gap-6">
			<div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
				<div class="space-y-3">
					<div
						class={`inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm font-semibold ${status.badgeClass}`}
					>
						<span class="h-2 w-2 rounded-full bg-current"></span>
						{status.label}
					</div>

					<div class="space-y-2">
						<h1 class="max-w-lg text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
							{status.title}
						</h1>
					</div>
				</div>
			</div>

			<div class="rounded-md border bg-gray-50 px-4 py-3 text-sm text-gray-600">
				{status.description}
			</div>

			<div class="mt-4 flex flex-col gap-3 sm:flex-row">
				<button
					class={`inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-white transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${status.buttonPrimary}`}
					onclick={navigateToTaskList}
				>
					Zpátky na výběr lekcí
				</button>

				{#if exitType === TaskResult.Mistake}
					<button
						class={`inline-flex items-center justify-center rounded-md border px-5 py-3 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${status.buttonSecondary}`}
						onclick={retryTask}
					>
						Zkusit lekci znovu
					</button>
				{/if}
			</div>
		</div>
	</section>
</div>
