<script lang="ts">
	import CibuleSymbol from '$lib/components/tasks/cibule/components/CibuleSymbol.svelte';

	interface Props {
		symbols: string[];
		validateSymbolClick: (symbol: string, index: number) => boolean;
		isPractice?: boolean;
	}

	let { symbols, validateSymbolClick, isPractice = false }: Props = $props();
</script>

{#each symbols as symbol, index (index)}
	<CibuleSymbol {symbol} {index} {validateSymbolClick} {isPractice} />
{/each}