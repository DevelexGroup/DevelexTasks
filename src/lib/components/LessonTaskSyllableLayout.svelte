<script lang="ts">
	import { fade } from 'svelte/transition';

	export let isCrossfixVisible: boolean = true;

	const inOptions = { duration: 750, delay: 200 };
	const outOptions = { duration: 200 };
</script>

<div class="relative mx-auto h-full w-full max-w-7xl p-12">
	{#if isCrossfixVisible}
		<div
			in:fade={inOptions}
			out:fade={outOptions}
			class="items-left absolute left-0 top-0 flex h-full w-full justify-start"
		>
			<slot name="crossfix-area">
				<div class="h-24 w-24 rounded-md bg-red-500 text-white">Unoccupied crossfix area</div>
			</slot>
		</div>
	{:else}
		<div
			in:fade={inOptions}
			out:fade={outOptions}
			class="absolute left-0 top-0 flex h-full w-full items-center justify-center"
		>
			<slot name="task-area">
				<div class="h-24 w-24 rounded-md bg-green-500 text-white">Unoccupied task area</div>
			</slot>
		</div>
	{/if}
</div>
