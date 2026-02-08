<script lang="ts">
	import GazeArea from '$lib/components/common/GazeArea.svelte';
	import { cn } from '$lib/utils';
	import { resolveAny } from '$lib/utils/resolveAny';
	import type { VisDiffItem } from '../dyslex.types';

	interface Props {
		data: VisDiffItem;
		elementBufferSize?: number;
		slide: number;
		isPractice: boolean;
		border: {
			outer: number;
			inner: number;
		};
	}

	let { data, elementBufferSize = 0, slide, isPractice, border }: Props = $props();
</script>

<div
	class="divide-2 grid border-solid border-black"
	style={`grid-template-columns: repeat(${data.cols}, minmax(0, 1fr)); border-width: ${border.outer}px;`}
>
	{#each Array.from({ length: data.end - data.start + 1 }, (_, i) => data.start + i) as item}
		<GazeArea id={`visdiff-${slide}-${item}`} bufferSize={elementBufferSize}>
			<button class="cursor-pointer">
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
