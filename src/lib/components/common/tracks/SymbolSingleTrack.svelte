<script lang="ts">
	import SymbolElement from '$lib/components/common/tracks/SymbolElement.svelte';

	interface Props {
		symbols: string[] | string[][];
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

	const singleRowSymbols = $derived(() => Array.isArray(symbols[0]) ? (symbols as string[][]).flat() : (symbols as string[]));
</script>

<div class="flex items-center justify-center" style="gap: {symbolSpacing}px;">
{#each singleRowSymbols() as symbol, index (index)}
		<SymbolElement {symbol} {index} {letterSpacing} {validateSymbolClick} />
{/each}
</div>