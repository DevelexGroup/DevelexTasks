<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import { id } from '$lib/components/tasks/zrakovka/levels/2/index';
	import { resolveAny } from '$lib/utils/resolveAny';
	import { zrakovkaZacvikData } from '$lib/components/tasks/zrakovka/zrakovka.data';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import {
		defaultValidateStage,
		defaultValidateSymbol,
		getLevelData
	} from '$lib/utils/trackLevelUtils';
	import ImageSymbolElement from '$lib/components/common/tracks/ImageSymbolElement.svelte';
	import { formatZrakovkaRawData, zrakovkaLevelPreset } from '../..';
	import { getBreakpointValue, scaleResponsiveSize } from '$lib/utils/responsive';
	import type { ZrakovkaRawDataEntry } from '$lib/components/tasks/zrakovka/zrakovka.types';

	const preset = zrakovkaLevelPreset.find((level) => level.levelID === id)?.practiceContent;
	const data = preset
		? getLevelData<ZrakovkaRawDataEntry>(preset, zrakovkaZacvikData, formatZrakovkaRawData)
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

	function getScaledSize(baseSize: number): number {
		return scaleResponsiveSize(baseSize * sizeMultiplier, innerWidth, innerHeight);
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
			taskStage.set(TaskStage.Instructions);
		}}
		isPractice={true}
	>
		{#snippet hintComponent({ state })}
			{#if state.dataEntry.correct?.length}
				<div style="width: {getScaledSize(12) * 0.25}rem; height: {getScaledSize(12) * 0.25}rem;">
					<img
						class="h-full w-full object-contain"
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
						width={getScaledSize(12)}
						basePath="/images/tasks/zrakovka"
					/>
				{/snippet}
			</SymbolTrack>
		{/snippet}
	</TrackLevel>
{/if}
