<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage, type TrackTaskPreset } from '$lib/types/task.types';
	import { id } from '$lib/components/tasks/zrakovka/levels/1/index';
	import { zrakovkaLevel1Data } from '$lib/components/tasks/zrakovka/zrakovka.data';
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
	import { getSize } from '../../zrakovka.utils';
	import { getBreakpointValue, scaleResponsiveSize } from '$lib/utils/responsive';

	interface Props {
		taskPreset?: TrackTaskPreset<ZrakovkaRawDataEntry>
		excludeTags?: string[]
	}

	let {
		taskPreset = zrakovkaLevelPreset,
		excludeTags
	 }: Props = $props();

	const levelPreset = taskPreset.find((level) => level.levelID === id)?.content;
	const data = levelPreset
		? getLevelData<ZrakovkaRawDataEntry>(levelPreset, zrakovkaLevel1Data, formatZrakovkaRawData, excludeTags)
		: null;

	let innerWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1920);
	let innerHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 1080);

	const sizeMultiplier = $derived(
		getBreakpointValue(innerWidth, {
			base: 0.5,
			sm: 0.7,
			md: 0.8,
			lg: 0.9,
			xl: 1,
			'2xl': 1.05
		})
	);

	function getScaledSize(
		baseSize: number,
		multiplier: number,
		viewportWidth: number,
		viewportHeight: number
	): number {
		return scaleResponsiveSize(baseSize * multiplier, viewportWidth, viewportHeight);
	}
</script>

<svelte:window bind:innerWidth bind:innerHeight />

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
					<div
						style:font-size={`${getScaledSize(getSize(state.dataEntry.size), sizeMultiplier, innerWidth, innerHeight)}px`}
					>
						<SymbolElement
							symbol={state.dataEntry.correct[0]}
							interactable={false}
							fontFamily={state.dataEntry.font}
							fontSize={`${getScaledSize(getSize(state.dataEntry.size), sizeMultiplier, innerWidth, innerHeight)}px`}
						/>
					</div>
				{:else}
					<ImageSymbolElement
						symbol={state.dataEntry.correct[0]}
						basePath="/images/tasks/zrakovka"
						height={getScaledSize(
							getSize(state.dataEntry.size) / 6,
							sizeMultiplier,
							innerWidth,
							innerHeight
						)}
						width={getScaledSize(
							getSize(state.dataEntry.size) / 6,
							sizeMultiplier,
							innerWidth,
							innerHeight
						)}
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
							fontSize={`${getScaledSize(getSize(dataEntry?.size ?? 0), sizeMultiplier, innerWidth, innerHeight)}px`}
						/>
					{:else}
						<ImageSymbolElement
							{symbol}
							{index}
							{validateSymbolClick}
							basePath="/images/tasks/zrakovka"
							height={getScaledSize(
								getSize(dataEntry?.size) / 6,
								sizeMultiplier,
								innerWidth,
								innerHeight
							)}
							width={getScaledSize(
								getSize(dataEntry?.size) / 6,
								sizeMultiplier,
								innerWidth,
								innerHeight
							)}
						/>
					{/if}
				{/snippet}
			</SymbolTrack>
		{/snippet}
	</TrackLevel>
{/if}
