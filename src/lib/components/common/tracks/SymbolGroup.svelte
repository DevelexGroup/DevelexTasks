<script lang="ts">
import GazeArea from '$lib/components/common/GazeArea.svelte';
import type { Snippet } from 'svelte';
import type { TrackSymbolComponent } from '$lib/types/task.types';
import SymbolElement from '$lib/components/common/tracks/SymbolElement.svelte';

interface Props {
	id: string;
	index: number;
	symbols: string[];
	validateSymbolClick: (symbol: string, index: number) => boolean;
	letterSpacing?: number;
	symbolSnippet?: Snippet<[TrackSymbolComponent]>;
}

let {
	id,
	index,
	symbols,
	validateSymbolClick,
	letterSpacing = 0,
	symbolSnippet = undefined
}: Props = $props();
</script>

<GazeArea {id} bufferSize={50}>
	<div class="flex items-center justify-center">
		{#each symbols as symbol, groupIndex (groupIndex)}
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
</GazeArea>