<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { type TaskMistake, TaskStage, type TrackTaskState } from '$lib/types/task.types';
	import { id, rawData } from '$lib/components/tasks/fonologie/levels/1/index';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import { getLevelData, getWordAudioSource } from '$lib/utils/trackLevelUtils';
	import AudioHint from '$lib/components/common/AudioHint.svelte';
	import ImageSymbolElement from '$lib/components/common/tracks/ImageSymbolElement.svelte';
	import { MistakeUnfinished } from '$lib/types/mistakes.types';
	import {
		fonologieLevelPreset,
		fonologieStageValidation,
		fonologieSymbolValidation, formatFonologieRawData, getShowcaseData
	} from '$lib/components/tasks/fonologie';
	import { fade } from 'svelte/transition';
	import type { FonologieAudioRawDataEntry } from '$lib/components/tasks/fonologie/fonologie.types';

	const preset = fonologieLevelPreset.find((level) => level.levelID === id)?.practiceContent;
	const data = preset ? getLevelData<FonologieAudioRawDataEntry>(preset, rawData, formatFonologieRawData) : null;
	const showcaseData = data ? getShowcaseData(data) : null;

	let symbolsShowcase = true;

	function allSymbolsClicked(state: TrackTaskState): TaskMistake[] | true {
		const selectedCount = state.selectedCorrectIndices.length;
		const totalCount = state.dataEntry.sequence.length;
		if (selectedCount < totalCount) {
			return [MistakeUnfinished];
		}
		return true;
	}
</script>

{#if showcaseData && symbolsShowcase}
	<div class="symbols-showcase" transition:fade>
		<TrackLevel
			id={`${id}-showcase`}
			data={showcaseData}
			validateSymbol={() => true}
			validateStage={allSymbolsClicked}
			isPractice={true}
			onCompleted={() => {
				symbolsShowcase = false;
			}}
			playValidationSounds={false}
		>
			{#snippet trackComponent({ symbols, correctSymbols, validateSymbolClick })}
				<SymbolTrack {symbols} {correctSymbols} {validateSymbolClick} symbolSpacing={16}>
					{#snippet symbolSnippet({ symbol, index })}
						<ImageSymbolElement
							{symbol}
							{index}
							{validateSymbolClick}
							basePath="/images/tasks/fonologie"
							extension="webp"
							wordToRead={symbol}
							width={40}
						/>
					{/snippet}
				</SymbolTrack>
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
			isPractice={true}
			onCompleted={() => {
				taskStage.set(TaskStage.Instructions);
			}}
		>
			{#snippet hintComponent({ state })}
				{#if state.dataEntry.sound}
					<AudioHint
						audioSrc={getWordAudioSource(state.dataEntry.sound)}
						playOnStart
						playOnStartDelay={750}
						ttsFallback={state.dataEntry.sound}
					/>
				{/if}
			{/snippet}
			{#snippet trackComponent({ symbols, correctSymbols, validateSymbolClick })}
				<SymbolTrack {symbols} {correctSymbols} {validateSymbolClick} symbolSpacing={16}>
					{#snippet symbolSnippet({ symbol, index })}
						<ImageSymbolElement
							{symbol}
							{index}
							{validateSymbolClick}
							basePath="/images/tasks/fonologie"
							extension="webp"
							width={40}
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
</style>
