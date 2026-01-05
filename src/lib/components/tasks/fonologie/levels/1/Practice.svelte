<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { type TaskMistake, TaskStage, type TrackLevelState } from '$lib/types/task.types';
	import { fonologieTestData } from '$lib/components/tasks/fonologie/fonologie.data';
	import { getShowcaseData, id } from '$lib/components/tasks/fonologie/levels/1/index';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import { getWordAudioSource	} from '$lib/utils/trackLevelUtils';
	import AudioHint from '$lib/components/common/AudioHint.svelte';
	import ImageSymbolElement from '$lib/components/common/tracks/ImageSymbolElement.svelte';
	import { MistakeUnfinished } from '$lib/types/mistakes.types';
	import { fonologieStageValidation, fonologieSymbolValidation } from '$lib/components/tasks/fonologie';
	import { fade } from 'svelte/transition';

	const data = fonologieTestData.find((level => level.levelID === id))?.practiceContent;
	const showcaseData = data ? getShowcaseData(data) : null;

	let symbolsShowcase = true;

	function allSymbolsClicked(state: TrackLevelState) : TaskMistake[] | true {
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
		<TrackLevel id={`${id}-showcase`} data={showcaseData} validateSymbol={() => true} validateStage={allSymbolsClicked} isPractice={true} onCompleted={() => {symbolsShowcase = false}} playValidationSounds={false}>
			{#snippet trackComponent({ symbols, correctSymbols, validateSymbolClick })}
				<SymbolTrack {symbols} {correctSymbols} {validateSymbolClick} symbolSpacing={16}>
					{#snippet symbolSnippet({ symbol, index })}
						<ImageSymbolElement {symbol} {index} {validateSymbolClick} basePath="/images/tasks/fonologie" extension="webp" wordToRead={symbol} width={40}/>
					{/snippet}
				</SymbolTrack>
			{/snippet}
		</TrackLevel>
	</div>
{/if}
{#if data && !symbolsShowcase}
	<div class="task" transition:fade>
		<TrackLevel {id} data={data} validateSymbol={fonologieSymbolValidation} validateStage={fonologieStageValidation} isPractice={true} onCompleted={() => {taskStage.set(TaskStage.Instructions)}}>
			{#snippet hintComponent({ state })}
				{#if state.dataEntry.wordToRead}
					<AudioHint audioSrc={getWordAudioSource(state.dataEntry.wordToRead)} playOnStart playOnStartDelay={750} ttsFallback={state.dataEntry.wordToRead} />
				{/if}
			{/snippet}
			{#snippet trackComponent({ symbols, correctSymbols, validateSymbolClick })}
				<SymbolTrack {symbols} {correctSymbols} {validateSymbolClick} symbolSpacing={16}>
					{#snippet symbolSnippet({ symbol, index })}
						<ImageSymbolElement {symbol} {index} {validateSymbolClick} basePath="/images/tasks/fonologie" extension="webp" width={40} />
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