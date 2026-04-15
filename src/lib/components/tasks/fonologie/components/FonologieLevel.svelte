<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage, type TrackTaskPreset } from '$lib/types/task.types';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import { getLevelData } from '$lib/utils/trackLevelUtils';
	import AudioHint from '$lib/components/common/AudioHint.svelte';
	import ImageSymbolElement from '$lib/components/common/tracks/ImageSymbolElement.svelte';
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
		showShowcaseTitle?: boolean;
		taskPreset?: TrackTaskPreset<FonologieTaskRawDataEntry>;
		excludeTags?: string[];
	}

	let { isPractice = false, id, rawData, useCategories = false, showShowcaseTitle = false, taskPreset = fonologieLevelPreset, excludeTags }: Props = $props();

	const levelPreset = taskPreset?.find((level) => level.levelID === id);
	const preset = isPractice ? levelPreset?.practiceContent : levelPreset?.content;

	// Select one random topic (only used when useCategories is true)
	// First, determine the level value from the preset so we only pick categories that exist for this level
	const presetLevel = preset
		?.map((item) => ('generate' in item ? (item.generate as Record<string, unknown>)?.level : undefined))
		.find((level) => level != null) as string | undefined;
	const levelFilteredRawData = presetLevel
		? rawData.filter((entry) => (entry as FonologieAudioRawDataEntry).level === presetLevel)
		: rawData;

	function generateLevelDataWithCategory() {
		if (!preset) return { data: null, showcaseData: null };

		if (!useCategories) {
			const data = getLevelData<FonologieTaskRawDataEntry>(preset, rawData, formatFonologieRawData, excludeTags);
			return { data, showcaseData: getShowcaseData(data, true) };
		}

		// Get all unique categories and shuffle them
		const availableCategories = [...new Set(levelFilteredRawData.map((entry) => (entry as FonologieAudioRawDataEntry).set))];
		for (let i = availableCategories.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[availableCategories[i], availableCategories[j]] = [availableCategories[j], availableCategories[i]];
		}

		// Try each category until one succeeds
		for (const category of availableCategories) {
			try {
				const filtered = rawData.filter((entry) => (entry as FonologieAudioRawDataEntry).set === category);
				const data = getLevelData<FonologieTaskRawDataEntry>(preset, filtered, formatFonologieRawData, excludeTags);
				console.log('Selected random category:', category);
				return { data, showcaseData: getShowcaseData(data, true) };
			} catch (e) {
				console.warn(`Category "${category}" failed, trying another...`, e);
			}
		}

		console.error('No valid category found for the given preset.');
		return { data: null, showcaseData: null };
	}

	const { data, showcaseData } = generateLevelDataWithCategory();

	const topicName = $derived(data?.length ? data[0].topic : null);

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
</script>

<svelte:window bind:innerWidth bind:innerHeight />

{#if showcaseData && symbolsShowcase}
	<div class="symbols-showcase" style="--optimal-columns: {optimalColumns}" transition:fade>
		<TrackLevel
			id={`${id}-showcase`}
			data={showcaseData}
			validateSymbol={() => true}
			validateStage={() => true}
			{isPractice}
			onCompleted={() => {
				symbolsShowcase = false;
			}}
			playValidationSounds={false}
		>
			{#snippet trackComponent({ symbols, correctSymbols, validateSymbolClick })}
				<SymbolTrack {symbols} {correctSymbols} {validateSymbolClick} symbolSpacing={16}>
					{#snippet symbolSnippet({ symbol, index })}
						{@const wordAudioSrc = `/sound/fonologie/words/${symbol?.replace(/[0-9]+/g, '').replace(/[A-Z]+/g, '')}.ogg`}

						<ImageSymbolElement
							{symbol}
							{index}
							{validateSymbolClick}
							basePath="/images/tasks/fonologie"
							extension="webp"
							audioSrc={wordAudioSrc}
							width={symbolSize}
							height={symbolSize}
						/>
					{/snippet}
				</SymbolTrack>
			{/snippet}
			{#snippet extraComponent()}
				{#if showShowcaseTitle && topicName}
					<div class="text-center text-5xl font-semibold text-gray-700">
						<h2>
							{topicName.charAt(0).toUpperCase() + topicName.slice(1).toLowerCase()}
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
