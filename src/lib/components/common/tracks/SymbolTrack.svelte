<script lang="ts">
	import SymbolElement from '$lib/components/common/tracks/SymbolElement.svelte';
	import type { Snippet } from 'svelte';
	import type { TrackSymbolComponent } from '$lib/types/task.types';

	interface Props {
		symbols: string[] | string[][];
		validateSymbolClick: (symbol: string, index: number) => boolean;
		letterSpacing?: number;
		symbolSpacing?: number;
		flattenRows?: boolean;
		symbolSnippet?: Snippet<[TrackSymbolComponent]>;
	}

	// Snippet from SymbolElement
	let {
		symbols,
		validateSymbolClick,
		letterSpacing = 0,
		symbolSpacing = 0,
		flattenRows = false,
		symbolSnippet = undefined
	}: Props = $props();

	const symbolRows = $derived(
		Array.isArray(symbols[0]) ? (symbols as string[][]) : ([symbols] as string[][])
	);

	const singleRowSymbols = $derived(() => Array.isArray(symbols[0]) ? (symbols as string[][]).flat() : (symbols as string[]));

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

{#if flattenRows}
	<div class="flex items-center justify-center" style="gap: {symbolSpacing}px;">
		{#each singleRowSymbols() as symbol, index (index)}
			{#if symbolSnippet}
				{@render symbolSnippet({
					symbol,
					index,
					letterSpacing,
					validateSymbolClick
				})}
			{:else}
				<SymbolElement {symbol} {index} {letterSpacing} {validateSymbolClick} />
			{/if}
		{/each}
	</div>
{:else}
	<div class="flex flex-col items-start justify-center" style="gap: {symbolSpacing}px;">
		{#each symbolRows as symbolRow, rowIndex (rowIndex)}
			<div class="flex items-center justify-center" style="gap: {symbolSpacing}px;">
			{#each symbolRow as symbol, colIndex (`${rowIndex}-${colIndex}`)}
				{#if symbolSnippet}
					{@render symbolSnippet({
						symbol,
						index: flatIndexFor(rowIndex, colIndex),
						letterSpacing,
						validateSymbolClick
					})}
				{:else}
					<SymbolElement {symbol} {letterSpacing} {validateSymbolClick} index={flatIndexFor(rowIndex, colIndex)} />
				{/if}
			{/each}
			</div>
		{/each}
	</div>
{/if}