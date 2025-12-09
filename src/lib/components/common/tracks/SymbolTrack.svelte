<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { TrackSymbolComponent } from '$lib/types/task.types';
	import SymbolGroup from '$lib/components/common/tracks/SymbolGroup.svelte';

	interface Props {
		symbols: string[] | string[][];
		validateSymbolClick: (symbol: string, index: number) => boolean;
		correctSymbols?: string[];
		letterSpacing?: number;
		symbolSpacing?: number;
		flattenRows?: boolean;
		splitFiller?: boolean;
		symbolSnippet?: Snippet<[TrackSymbolComponent]>;
	}

	// Snippet from SymbolElement
	let {
		symbols,
		correctSymbols,
		validateSymbolClick,
		letterSpacing = 0,
		symbolSpacing = 0,
		flattenRows = false,
		splitFiller = false,
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

	console.log(correctSymbols);
	const isCorrectSymbol = (symbol: string): boolean => correctSymbols ? correctSymbols.includes(symbol) : false;
</script>

{#if flattenRows}
	<div class="flex items-center justify-center" style="gap: {symbolSpacing}px;">
		{#each singleRowSymbols() as symbolGroup, index (index)}
			<SymbolGroup
				id={`group-${index}`}
				index={index}
				symbols={splitFiller && !isCorrectSymbol(symbolGroup) ? symbolGroup.split('') : [symbolGroup]}
				{letterSpacing}
				{validateSymbolClick}
				{symbolSnippet}
			/>
		{/each}
	</div>
{:else}
	<div class="flex flex-col items-start justify-center" style="gap: {symbolSpacing}px;">
		{#each symbolRows as symbolRow, rowIndex (rowIndex)}
			<div class="flex items-center justify-center" style="gap: {symbolSpacing}px;">
			{#each symbolRow as symbolGroup, colIndex (`${rowIndex}-${colIndex}`)}
				<SymbolGroup
					id={`group-${flatIndexFor(rowIndex, colIndex)}`}
					index={flatIndexFor(rowIndex, colIndex)}
					symbols={splitFiller && !isCorrectSymbol(symbolGroup) ? symbolGroup.split('') : [symbolGroup]}
					{letterSpacing}
					{validateSymbolClick}
					{symbolSnippet}
				/>
			{/each}
			</div>
		{/each}
	</div>
{/if}