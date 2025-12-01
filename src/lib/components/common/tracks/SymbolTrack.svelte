<script lang="ts">
	import SymbolElement from '$lib/components/common/tracks/SymbolElement.svelte';

	interface Props {
		symbols: string[];
		validateSymbolClick: (symbol: string, index: number) => boolean;
		letterSpacing?: number;
		symbolSpacing?: number;
	}

	let {
		symbols,
		validateSymbolClick,
		letterSpacing = 0,
		symbolSpacing = 0
	}: Props = $props();
</script>

<div class="flex items-center justify-center" style="gap: {symbolSpacing}px;">
{#each symbols as symbol, index (index)}
		<SymbolElement {symbol} {index} {letterSpacing} {validateSymbolClick} />
{/each}
</div>