<script lang="ts">
	import GazeArea from '$lib/components/common/GazeArea.svelte';
	import { getContext, type Snippet } from 'svelte';
	import type { TrackSymbolComponent } from '$lib/types/task.types';
	import SymbolElement from '$lib/components/common/tracks/SymbolElement.svelte';
	import type { AnalyticsManager } from '$lib/utils/analyticsManager';
	import {
		ANALYTICS_MANAGER_KEY,
		SCREENSHOT_MODE_KEY,
		type ScreenshotModeContext
	} from '$lib/types/general.types';

	interface Props {
		id: string;
		index: number;
		symbols: string[];
		isCorrect: boolean;
		validateSymbolClick: (symbol: string, index: number) => boolean;
		letterSpacing?: number;
		symbolSnippet?: Snippet<[TrackSymbolComponent]>;
	}

	let analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);
	const screenshot = getContext<ScreenshotModeContext | undefined>(SCREENSHOT_MODE_KEY);

	let groupId = $derived(() => (isCorrect ? `target-${id}` : id));

	let {
		id,
		index,
		symbols,
		isCorrect,
		validateSymbolClick,
		letterSpacing = 0,
		symbolSnippet = undefined
	}: Props = $props();

	const validateGroupClick = (symbol: string, index: number): boolean => {
		analyticsManager.logEvent(`select_${groupId()}`);
		return validateSymbolClick(symbol, index);
	};
</script>

<GazeArea id={groupId()} bufferSize={50}>
	<div
		class="flex items-center justify-center"
		class:screenshot-target={screenshot?.highlightTargets && isCorrect}
	>
		{#each symbols as symbol, groupIndex (groupIndex)}
			{#if symbolSnippet}
				{@render symbolSnippet({
					symbol,
					index,
					letterSpacing,
					validateSymbolClick: validateGroupClick
				})}
			{:else}
				<SymbolElement {symbol} {index} {letterSpacing} validateSymbolClick={validateGroupClick} />
			{/if}
		{/each}
	</div>
</GazeArea>

<style>
	/* Answer-overlay highlight used by the admin stimulus-export tool */
	.screenshot-target {
		outline: 4px solid #16a34a;
		outline-offset: 4px;
		border-radius: 0.5rem;
		background: rgba(22, 163, 74, 0.12);
	}
</style>
