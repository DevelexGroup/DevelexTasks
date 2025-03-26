<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { Snippet } from 'svelte';

	interface Props {
		isCrossfixVisible?: boolean;
		crossFixArea?: Snippet;
		taskArea?: Snippet;
	}

	let { isCrossfixVisible = true, crossFixArea, taskArea }: Props = $props();

	const inOptions = { duration: 750, delay: 200 };
	const outOptions = { duration: 200 };
</script>

<div class="relative z-0 h-full w-full bg-[#FFFEE8]">
	<div class="relative mx-auto h-full w-full max-w-7xl p-12 py-32">
		{#if isCrossfixVisible}
			<div
				in:fade={inOptions}
				out:fade={outOptions}
				class="items-left absolute left-0 top-0 flex h-full w-full justify-start p-12 py-32"
			>
				{#if crossFixArea}
					{@render crossFixArea()}
				{:else}
					<div class="h-24 w-24 rounded-md bg-red-500 text-white">Unoccupied crossfix area</div>
				{/if}
			</div>
		{:else}
			<div
				in:fade={inOptions}
				out:fade={outOptions}
				class="absolute left-0 top-0 flex h-full w-full items-center justify-center"
			>
				{#if taskArea}
					{@render taskArea()}
				{:else}
					<div class="h-24 w-24 rounded-md bg-green-500 text-white">Unoccupied task area</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
