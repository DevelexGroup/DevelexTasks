<script lang="ts">
	import Icon from '@iconify/svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { TaskResult } from '$lib/types/task.types';
	import { currentTask } from '$lib/stores/task';

	interface Props {
		exitType: TaskResult;
	}

	let { exitType }: Props = $props();

	$effect(() => {
		console.log('Task ended with exit type:', exitType);
	});

	function retryTask() {
		if ($currentTask) {
			goto(resolve(`/tasks/${$currentTask.slug}`));
		} else {
			goto(resolve(`/`));
		}
	}
</script>

<div
	in:fade={{ duration: 250 }}
	class="flex h-screen w-full flex-col items-center justify-center gap-4"
>
	{#if exitType === TaskResult.Natural}
		<h1 class="text-3xl font-bold text-neutral-600">Lekce úspěšně dokončena!</h1>

		<div
			class="inline-flex h-14 w-14 items-center justify-center rounded-full border border-green-200 bg-gray-100"
		>
			<Icon icon="material-symbols:thumb-up-outline-rounded" class="h-8 w-8 text-green-500" />
		</div>
	{:else if exitType === TaskResult.Mistake || exitType === TaskResult.Escape || exitType === TaskResult.Timeout}
		<h1 class="text-3xl font-bold text-neutral-600">Lekce byla přerušena</h1>

		<div
			class="inline-flex h-14 w-14 items-center justify-center rounded-full border border-yellow-200 bg-gray-100"
		>
			<Icon icon="material-symbols:exit-to-app-rounded" class="h-8 w-8 text-yellow-500" />
		</div>
	{/if}
	<div class="mt-6 flex gap-2">
		<button
			class="rounded-md bg-blue-500 px-3 py-1.5 text-gray-50 hover:bg-blue-600"
			onclick={() => goto(resolve(`/`))}
		>
			Zpátky na výběr lekcí
		</button>
		{#if exitType === TaskResult.Mistake}
			<button
				class="rounded-md bg-green-500 px-3 py-1.5 text-gray-50 hover:bg-green-600"
				onclick={retryTask}
			>
				Zkusit lekci znovu
			</button>
		{/if}
	</div>
</div>
