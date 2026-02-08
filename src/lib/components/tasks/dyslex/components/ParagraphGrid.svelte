<script lang="ts">
	import GazeArea from '$lib/components/common/GazeArea.svelte';
	import type { MeantextItem } from '../dyslex.types';

	interface Props {
		data: MeantextItem[];
		lineGap: number;
		elementBufferSize?: number;
	}

	let { data, lineGap, elementBufferSize = 15 }: Props = $props();
</script>

<div class="flex h-full flex-col items-start justify-center" style={`row-gap: ${lineGap}px;`}>
	{#each data as line, i}
		<div
			class="flex w-full items-start justify-between text-[30px]"
			style={`width: ${line.width}px;`}
		>
			{#each line.data as item, j}
				<GazeArea id={`syllable-${i}-${j}-${item}`} bufferSize={elementBufferSize}>
					{item}
				</GazeArea>
			{/each}
		</div>
	{/each}
</div>
