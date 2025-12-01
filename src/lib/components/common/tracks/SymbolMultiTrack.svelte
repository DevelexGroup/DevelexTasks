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

	const symbolRows = $derived(
		Array.isArray(symbols[0]) ? (symbols as string[][]) : ([symbols] as string[][])
	);

	const rowLengths = $derived(symbolRows.map((row) => row.length));
	const rowOffsets = $derived(
		rowLengths.reduce<number[]>((acc, _len, i) => {
			if (i === 0) {
				acc[0] = 0;
			} else {
				acc[i] = acc[i - 1] + rowLengths[i - 1];
			}
			return acc;
		}, [])
	);

	const flatIndexFor = (rowIndex: number, colIndex: number) => rowOffsets[rowIndex] + colIndex;
</script>

<div class="flex flex-col items-start justify-center" style="gap: {symbolSpacing}px;">
	{#each symbolRows as symbolRow, rowIndex (rowIndex)}
		<div class="flex items-center justify-center" style="gap: {symbolSpacing}px;">
		{#each symbolRow as symbol, colIndex (`${rowIndex}-${colIndex}`)}
			<SymbolElement {symbol} {letterSpacing} {validateSymbolClick} index={flatIndexFor(rowIndex, colIndex)}
			/>
		{/each}
		</div>
	{/each}
</div>