<script lang="ts">
	import SymbolElement from '$lib/components/common/tracks/SymbolElement.svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		syllable: string;
		visible?: boolean;
	}

	let { syllable, visible = true }: Props = $props();
</script>

<div
	class="flex h-24 w-24 items-center justify-center rounded-xl border-3 border-gray-400 bg-transparent"
>
	{#if visible}
		<div transition:fade>
			<SymbolElement symbol={syllable} interactable={false} />
		</div>
	{/if}
</div>
