<script lang="ts">
	import CibuleSymbol from '$lib/components/tasks/cibule/components/CibuleSymbol.svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		syllable: string;
		visible?: boolean;
	}

	let { syllable, visible = true }: Props = $props();
</script>

<div class="flex w-24 h-24 items-center justify-center rounded-xl border-3 border-gray-400 bg-transparent">
	{#if visible}
		<div transition:fade>
			<CibuleSymbol symbol={syllable} interactable={false} />
		</div>
	{/if}
</div>