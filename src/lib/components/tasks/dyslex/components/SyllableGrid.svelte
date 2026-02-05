<script lang="ts">
	import GazeArea from '$lib/components/common/GazeArea.svelte';

	interface Props {
		data: string[][];
		gridSpacing: {
			x: number;
			y: number;
		};
		elementBufferSize?: number;
	}

	let { data, gridSpacing, elementBufferSize = 30 }: Props = $props();

	const rows = data.length;
	const cols = data[0]?.length || 0;
</script>

<div
	class="grid h-full w-full items-center justify-center"
	style={`grid-template-rows: repeat(${rows}, minmax(0, 1fr)); grid-template-columns: repeat(${cols}, minmax(0, 1fr)); column-gap: ${gridSpacing.x}px; row-gap: ${gridSpacing.y}px;`}
>
	{#each data as row, i}
		{#each row as syllable, j}
			<GazeArea id={`syllable-${i}-${j}-${syllable}`} bufferSize={elementBufferSize}>
				<span class="text-[23px]">
					{syllable}
				</span>
			</GazeArea>
		{/each}
	{/each}
</div>
