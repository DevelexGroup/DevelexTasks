<script lang="ts">
	import SymbolElement from '$lib/components/common/tracks/SymbolElement.svelte';
	import { fade } from 'svelte/transition';
	import { getContext } from 'svelte';
	import { SCREENSHOT_MODE_KEY, type ScreenshotModeContext } from '$lib/types/general.types';

	interface Props {
		syllable: string;
		visible?: boolean;
	}

	let { syllable, visible = true }: Props = $props();

	const screenshot = getContext<ScreenshotModeContext | undefined>(SCREENSHOT_MODE_KEY);
</script>

<div
	class="flex h-24 w-24 items-center justify-center rounded-xl border-3 border-gray-400 bg-transparent"
>
	{#if visible}
		<div transition:fade={screenshot ? { duration: 0 } : {}}>
			<SymbolElement symbol={syllable} interactable={false} />
		</div>
	{/if}
</div>
