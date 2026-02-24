<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import { id } from '$lib/components/tasks/zrakovka/levels/2/index';
	import { zrakovkaLevel2Data } from '$lib/components/tasks/zrakovka/zrakovka.data';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import {
		defaultValidateStage,
		defaultValidateSymbol,
		getLevelData
	} from '$lib/utils/trackLevelUtils';
	import ImageSymbolElement from '$lib/components/common/tracks/ImageSymbolElement.svelte';
	import { formatZrakovkaRawData, zrakovkaLevelPreset } from '../..';
	import type { ZrakovkaRawDataEntry } from '../../zrakovka.types';
	import SymbolElement from '$lib/components/common/tracks/SymbolElement.svelte';

	const preset = zrakovkaLevelPreset.find((level) => level.levelID === id)?.content;
	const data = preset
		? getLevelData<ZrakovkaRawDataEntry>(preset, zrakovkaLevel2Data, formatZrakovkaRawData)
		: null;
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
				{#if state.dataEntry.font !== 'PowerPoint'}
					<div style:font-size={`${state.dataEntry.size}px`}>
						<SymbolElement
							symbol={state.dataEntry.correct[0]}
							interactable={false}
							fontFamily={state.dataEntry.font}
							fontSize={`${state.dataEntry.size}px`}
						/>
					</div>
				{:else}
					<ImageSymbolElement
						symbol={state.dataEntry.correct[0]}
						basePath="/images/tasks/zrakovka"
						height={(state.dataEntry.size ?? 0) / 6}
						width={(state.dataEntry.size ?? 0) / 6}
					/>
				{/if}
			{/if}
		{/snippet}
		{#snippet trackComponent({ symbols, correctSymbols, validateSymbolClick, dataEntry })}
			<SymbolTrack {symbols} {correctSymbols} {validateSymbolClick} symbolSpacing={16}>
				{#snippet symbolSnippet({ symbol, index })}
					{#if dataEntry?.font !== 'PowerPoint'}
						<SymbolElement
							{symbol}
							{index}
							{validateSymbolClick}
							fontFamily={dataEntry?.font}
							fontSize={`${dataEntry?.size ?? 0}px`}
						/>
					{:else}
						<ImageSymbolElement
							{symbol}
							{index}
							{validateSymbolClick}
							basePath="/images/tasks/zrakovka"
							height={(dataEntry?.size ?? 0) / 6}
							width={(dataEntry?.size ?? 0) / 6}
						/>
					{/if}
				{/snippet}
			</SymbolTrack>
		{/snippet}
	</TrackLevel>
{/if}
