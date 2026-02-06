<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import { id } from '$lib/components/tasks/zrakovka/levels/1/index';
	import { resolveAny } from '$lib/utils/resolveAny';
	import { zrakovkaTestData } from '$lib/components/tasks/zrakovka/zrakovka.data';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import { defaultValidateStage, defaultValidateSymbol } from '$lib/utils/trackLevelUtils';
	import ImageSymbolElement from '$lib/components/common/tracks/ImageSymbolElement.svelte';

	const data = zrakovkaTestData.find((level) => level.levelID === id)?.content;
</script>

{#if data}
	<TrackLevel
		{id}
		{data}
		validateSymbol={defaultValidateSymbol}
		validateStage={defaultValidateStage}
		onCompleted={() => {
			taskStage.set(TaskStage.End);
		}}
	>
		{#snippet hintComponent({ state })}
			{#if state.dataEntry.correct?.length}
				<div class="h-20 w-20">
					<img
						class="h-20 h-full w-20 w-full object-contain"
						src={resolveAny(`/images/tasks/zrakovka/${state.dataEntry.correct[0]}.png`)}
						alt={state.dataEntry.correct[0]}
					/>
				</div>
			{/if}
		{/snippet}
		{#snippet trackComponent({ symbols, correctSymbols, validateSymbolClick })}
			<SymbolTrack {symbols} {correctSymbols} {validateSymbolClick} symbolSpacing={16}>
				{#snippet symbolSnippet({ symbol, index })}
					<ImageSymbolElement
						{symbol}
						{index}
						{validateSymbolClick}
						basePath="/images/tasks/zrakovka"
					/>
				{/snippet}
			</SymbolTrack>
		{/snippet}
	</TrackLevel>
{/if}
