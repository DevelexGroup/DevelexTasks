<script lang="ts">
	import { fly } from 'svelte/transition';
	import Loader from './Loader.svelte';

	interface Props {
		loadState: 'loading' | 'loaded' | 'error';
		loadTitle: string;
	}

	let { loadState, loadTitle }: Props = $props();
	let states: [string] = $state<[string]>([loadState]);

	// if new state is different from the last state, add it to the states array and remove the previous state
	$effect(() => {
		if (states[states.length - 1] !== loadState) {
			states = [loadState];
		}
	});

	const flyIn = {
		duration: 400,
		y: 40,
		opacity: 1
	};

	const flyOut = {
		duration: 400,
		y: -40,
		opacity: 1
	};
</script>

<div class="flex h-10 w-full items-center gap-2 text-neutral-600">
	<div class="relative h-full w-10 overflow-hidden rounded-full bg-neutral-200">
		{#each states as state, i (i)}
			{#if state === 'loading'}
				<div
					in:fly|local={flyIn}
					out:fly|local={flyOut}
					class="absolute inset-0 flex h-full w-full items-center justify-center bg-blue-200 p-1"
				>
					<Loader thickness="2px" size="1.5rem" color="border-blue-600" />
				</div>
			{/if}
			{#if state === 'loaded'}
				<div
					in:fly|local={flyIn}
					out:fly|local={flyOut}
					class="absolute inset-0 flex h-10 w-10 items-center justify-center bg-green-200 p-2"
				>
					<span class="text-2xl text-green-600">✓</span>
				</div>
			{/if}
			{#if state === 'error'}
				<div
					in:fly|local={flyIn}
					out:fly|local={flyOut}
					class="absolute inset-0 flex h-10 w-10 items-center justify-center bg-red-200 p-2"
				>
					<span class="text-2xl text-red-600">✗</span>
				</div>
			{/if}
		{/each}
	</div>
	{loadTitle}
</div>
