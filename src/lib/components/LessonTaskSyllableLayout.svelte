<script lang="ts">
	import { fade } from 'svelte/transition';

	export let isCrossfixVisible: boolean = true;
	export let isSyllableVisible: boolean = true;

	const inOptions = { duration: 750, delay: 200 };
	const outOptions = { duration: 200 };
</script>

<div class="relative h-full w-full p-12">
	{#if isCrossfixVisible}
		<div
			in:fade={inOptions}
			out:fade={outOptions}
			class="absolute left-0 top-0 flex h-full w-full items-center justify-center"
		>
			<slot name="crossfix-area" />
		</div>
	{:else}
		<div
			in:fade={inOptions}
			out:fade={outOptions}
			class="absolute left-0 top-0 flex h-full w-full items-center justify-center"
		>
			<div class="lesson-stack grid">
				{#if isSyllableVisible}
					<div
						in:fade={inOptions}
						out:fade={outOptions}
						class="flex w-24 items-center justify-start"
					>
						<slot name="syllable-area" />
					</div>
				{/if}
				<slot name="task-area" />
			</div>
		</div>
	{/if}
</div>

<style>
	.lesson-stack {
		display: grid;
		grid-template-columns: 6rem /* w-24 in tailwind */ 1fr;
	}
</style>
