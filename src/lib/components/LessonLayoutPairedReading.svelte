<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { Snippet } from 'svelte';

	interface Props {
		validateFixation: boolean;
		crossFix: Snippet;
		wordArea: Snippet;
	}

	let { validateFixation = true, crossFix, wordArea }: Props = $props();

	const inOptions = { duration: 750, delay: 200 };
	const outOptions = { duration: 200 };
</script>

<div class="lesson-stack grid w-full max-w-7xl auto-cols-auto items-center justify-center">
	{#if validateFixation}
		<div
			in:fade={inOptions}
			out:fade={outOptions}
			class="flex w-24 max-w-7xl items-center justify-start"
		>
			{@render crossFix()}
		</div>
	{/if}
	<div
		class="col-start-2 flex w-auto max-w-7xl flex-wrap items-center justify-center gap-x-12 transition-all"
		class:opacity-0={validateFixation}
	>
		<div class="flex w-auto max-w-7xl flex-wrap gap-x-12">
			{@render wordArea()}
		</div>
	</div>
</div>

<style>
	.lesson-stack {
		display: grid;
		grid-template-columns: 6rem /* w-24 in tailwind */ 1fr;
	}
</style>
