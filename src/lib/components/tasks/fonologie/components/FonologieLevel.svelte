<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { type TaskMistake, TaskStage, type TrackTaskPreset, type TrackTaskState } from '$lib/types/task.types';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import { getLevelData } from '$lib/utils/trackLevelUtils';
	import AudioHint from '$lib/components/common/AudioHint.svelte';
	import ImageSymbolElement from '$lib/components/common/tracks/ImageSymbolElement.svelte';
	import { MistakeUnfinished } from '$lib/types/mistakes.types';
	import {
		fonologieLevelPreset,
		fonologieStageValidation,
		fonologieSymbolValidation,
		formatFonologieRawData,
		getShowcaseData
	} from '$lib/components/tasks/fonologie';
	import { fade } from 'svelte/transition';
	import type {
		FonologieAudioRawDataEntry,
		FonologieTaskRawDataEntry
	} from '$lib/components/tasks/fonologie/fonologie.types';
	import { resolveAny } from '$lib/utils/resolveAny';
	import { scaleResponsiveSize } from '$lib/utils/responsive';

	interface Props {
		isPractice?: boolean;
		id: string;
		rawData: FonologieTaskRawDataEntry[];
		useCategories?: boolean;
		taskPreset?: TrackTaskPreset<FonologieTaskRawDataEntry>;
		excludeTags?: string[];
	}

	let { isPractice = false, id, rawData, useCategories = false, taskPreset = fonologieLevelPreset, excludeTags }: Props = $props();

	const levelPreset = taskPreset?.find((level) => level.levelID === id);
	const preset = isPractice ? levelPreset?.practiceContent : levelPreset?.content;

	// Select one random topic (only used when useCategories is true)
	const randomData = rawData[
		Math.floor(Math.random() * rawData.length)
	] as FonologieAudioRawDataEntry;
	const randomCategory = $derived(useCategories ? randomData.set : null);
	const randomTopicName = $derived(useCategories && randomCategory ? randomData.topic : null);
	const filteredRawData = $derived(
		useCategories
			? rawData.filter((entry) => (entry as FonologieAudioRawDataEntry).set === randomCategory)
			: rawData
	);

	const data = preset
		? getLevelData<FonologieTaskRawDataEntry>(preset, filteredRawData, formatFonologieRawData, excludeTags)
		: null;
	const showcaseData = data ? getShowcaseData(data, true) : null;

	// Track window dimensions for dynamic aspect ratio
	let innerWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1920);
	let innerHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 1080);
	const aspectRatio = $derived(innerWidth / innerHeight);

	const symbolSize = $derived(
		scaleResponsiveSize(36, innerWidth, innerHeight, {
			maxMultiplier: 1.05,
			exponent: 1.35
		})
	);

	// Calculate optimal columns to fill out the screen area with symbols in showcase
	const showcaseSymbolCount = $derived(
		showcaseData?.[0]?.sequence
			? Array.isArray(showcaseData[0].sequence[0])
				? (showcaseData[0].sequence as string[][]).flat().length
				: showcaseData[0].sequence.length
			: 0
	);
	const optimalColumns = $derived(Math.ceil(Math.sqrt(showcaseSymbolCount * aspectRatio)));

	let symbolsShowcase = $state(true);

	function allSymbolsClicked(state: TrackTaskState): TaskMistake[] | true {
		const selectedCount = state.selectedCorrectIndices.length;
		const totalCount = state.dataEntry.sequence.length;
		if (selectedCount < totalCount) {
			return [MistakeUnfinished];
		}
		return true;
	}
</script>

<svelte:window bind:innerWidth bind:innerHeight />

{#if showcaseData && symbolsShowcase}
	<div class="symbols-showcase" style="--optimal-columns: {optimalColumns}" transition:fade>
		<TrackLevel
			id={`${id}-showcase`}
			data={showcaseData}
			validateSymbol={() => true}
			validateStage={allSymbolsClicked}
			{isPractice}
			onCompleted={() => {
				symbolsShowcase = false;
			}}
			playValidationSounds={false}
		>
			{#snippet trackComponent({ symbols, correctSymbols, validateSymbolClick })}
				<SymbolTrack {symbols} {correctSymbols} {validateSymbolClick} symbolSpacing={16}>
					{#snippet symbolSnippet({ symbol, index })}
						{@const wordToRead = `fono/${symbol
							?.split('/')
							.at(-1)
							?.replace(/[0-9]+/g, '')
							.replace(/[A-Z]+/g, '')}.wav`}

						<ImageSymbolElement
							{symbol}
							{index}
							{validateSymbolClick}
							basePath="/images/tasks/fonologie"
							extension="webp"
							{wordToRead}
							width={symbolSize}
							height={symbolSize}
						/>
					{/snippet}
				</SymbolTrack>
			{/snippet}
			{#snippet extraComponent()}
				{#if useCategories && randomTopicName}
					<div class="text-center text-5xl font-semibold text-gray-700">
						<h2>
							{randomTopicName.charAt(0).toUpperCase() + randomTopicName.slice(1).toLowerCase()}
						</h2>
					</div>
				{/if}
			{/snippet}
		</TrackLevel>
	</div>
{/if}
{#if data && !symbolsShowcase}
	<div class="task" transition:fade>
		<TrackLevel
			{id}
			{data}
			validateSymbol={fonologieSymbolValidation}
			validateStage={fonologieStageValidation}
			{isPractice}
			onCompleted={() => {
				taskStage.set(isPractice ? TaskStage.Instructions : TaskStage.End);
			}}
		>
			{#snippet hintComponent({ state })}
				<div class="flex items-center justify-center gap-16">
					{#if state.dataEntry.sound}
						<AudioHint
							audioSrc={resolveAny(`/sound/fonologie/${id}/${state.dataEntry.sound}`)}
							playOnStart
							playOnStartDelay={750}
							ttsFallback={state.dataEntry.sound}
						/>
					{/if}

					{#if state.dataEntry.model}
						<ImageSymbolElement
							symbol={state.dataEntry.model[0]}
							basePath="/images/tasks/fonologie"
							extension="webp"
							width={symbolSize}
							interactable={false}
						/>
					{/if}
				</div>
			{/snippet}
			{#snippet trackComponent({ symbols, correctSymbols, validateSymbolClick })}
				<SymbolTrack {symbols} {correctSymbols} {validateSymbolClick} symbolSpacing={48}>
					{#snippet symbolSnippet({ symbol, index })}
						<ImageSymbolElement
							{symbol}
							{index}
							{validateSymbolClick}
							basePath="/images/tasks/fonologie"
							extension="webp"
							width={symbolSize}
						/>
					{/snippet}
				</SymbolTrack>
			{/snippet}
		</TrackLevel>
	</div>
{/if}

<style>
	.symbols-showcase :global(.symbol--image.selected) {
		border-radius: 0.75rem;
		background: rgba(0, 0, 0, 0.05);
		transition: background 0.3s ease;
	}

	.symbols-showcase :global(.symbols-wrapper__row) {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		padding: 0 1rem;
		/* Width = columns * item-width + (columns - 1) * gap */
		--item-width: 160px;
		--gap: 64px;
		gap: var(--gap) !important;
		width: calc(
			var(--optimal-columns, 4) * var(--item-width) + (var(--optimal-columns, 4) - 1) * var(--gap)
		);
		max-width: 100%;
		margin: 0 auto;
	}

	:global(.symbol--image img) {
		pointer-events: none;
	}

	.symbols-showcase :global(.extra-component) {
		order: -1;
		margin-bottom: 2rem;
		margin-top: -2rem;
	}
</style>
