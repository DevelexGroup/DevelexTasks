<script lang="ts">
	import GazeArea from '$lib/components/common/GazeArea.svelte';
	import { cn } from '$lib/utils';
	import { resolveAny } from '$lib/utils/resolveAny';
	import type { VisDiffItem } from '../dyslex.types';
	import { getContext } from 'svelte';
	import { SCREENSHOT_MODE_KEY, type ScreenshotModeContext } from '$lib/types/general.types';

	interface Props {
		data: VisDiffItem;
		elementBufferSize?: number;
		slide: number;
		isPractice: boolean;
		border: {
			outer: number;
			inner: number;
		};
		onClick: (item: number, aoi: string, isCorrect: boolean) => void;
	}

	let { data, elementBufferSize = 0, slide, isPractice, border, onClick }: Props = $props();

	const screenshot = getContext<ScreenshotModeContext | undefined>(SCREENSHOT_MODE_KEY);
</script>

<div
	class="divide-2 grid border-solid border-black"
	style={`grid-template-columns: repeat(${data.cols}, minmax(0, 1fr)); border-width: ${border.outer}px;`}
>
	{#each Array.from({ length: data.end - data.start + 1 }, (_, i) => data.start + i) as item (item)}
		{@const aoi = `visdiff-${slide + 1}-${item}`}
		<GazeArea id={aoi} bufferSize={elementBufferSize}>
			<button
				class="cursor-pointer"
				class:screenshot-target={screenshot?.highlightTargets && data.correct.includes(item)}
				onclick={() => onClick(item, aoi, data.correct.includes(item))}
			>
				<img
					class={cn(
						'border-solid border-black',
						isPractice ? 'h-[142px] w-[222px]' : 'h-[77px] w-[123px]'
					)}
					src={resolveAny(
						`/images/tasks/dyslex/visdiff/${isPractice ? 'practice' : 'content'}/${slide + 1}/part${item}.jpg`
					)}
					alt={`Item ${item}`}
					style={`border-width: ${border.inner}px;`}
				/>
			</button>
		</GazeArea>
	{/each}
</div>

<style>
	/* Answer-overlay highlight used by the admin stimulus-export tool. Inset so it
	   stays visible inside the tight grid. */
	.screenshot-target {
		outline: 4px solid #16a34a;
		outline-offset: -4px;
	}
</style>
