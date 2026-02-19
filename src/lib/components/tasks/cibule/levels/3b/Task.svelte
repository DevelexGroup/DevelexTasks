<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { type TaskMistake, TaskStage, type TrackTaskState } from '$lib/types/task.types';
	import {
		id,
		rawData,
		validateSymbol,
		validateStage,
		isSyllableFrameVisible
	} from '$lib/components/tasks/cibule/levels/3b/index';
	import CibuleSyllableFrame from '$lib/components/tasks/cibule/components/CibuleSyllableFrame.svelte';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import { calculateFluencyScore, cibuleLevelPreset, formatCibuleRawData } from '$lib/components/tasks/cibule';
	import { getContext } from 'svelte';
	import { fade } from 'svelte/transition';
	import { AnalyticsManager } from '$lib/utils/analyticsManager';
	import { ANALYTICS_MANAGER_KEY } from '$lib/types/general.types';
	import { getLevelData, tryReadWordFromState } from '$lib/utils/trackLevelUtils';
	import { playSound, SOUND_MISTAKE } from '$lib/utils/sound';
	import { MistakeUnfinished } from '$lib/types/mistakes.types';
	import MicrophoneHint from '$lib/components/common/MicrophoneHint.svelte';
	import type { CibuleRawDataEntry } from '$lib/components/tasks/cibule/cibule.types';

	const preset = cibuleLevelPreset.find((level) => level.levelID === id)?.content;
	const data = preset ? getLevelData<CibuleRawDataEntry>(preset, rawData, formatCibuleRawData) : null;

	const analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);

	let spacePressed = false;

	function onSpace(state: TrackTaskState) {
		if (validateStage(state) === true) {
			tryReadWordFromState(state, analyticsManager);
			spacePressed = true;
		} else {
			playSound(SOUND_MISTAKE, 0.33);
		}
	}

	function validateStageWithSpace(state: TrackTaskState): true | TaskMistake[] {
		if (spacePressed) {
			return validateStage(state);
		}
		return [MistakeUnfinished];
	}

	function resetSpacePressed() {
		spacePressed = false;
	}
</script>

{#if data}
	<TrackLevel
		{id}
		{data}
		{validateSymbol}
		validateStage={validateStageWithSpace}
		stopLoggingValidationCheck={validateStage}
		{calculateFluencyScore}
		onCompleted={() => {
			taskStage.set(TaskStage.End);
		}}
		{onSpace}
		onStageAdvance={resetSpacePressed}
	>
		{#snippet extraComponent({ state })}
			<div class="flex gap-4">
				{#each state.dataEntry.correct as syllable, index (index)}
					<CibuleSyllableFrame
						{syllable}
						visible={isSyllableFrameVisible(state, syllable, index)}
					/>
				{/each}
				{#if validateStage(state) === true && !spacePressed}
					<div
						class="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2"
						in:fade|global={{ delay: 1000 }}
						out:fade|global
					>
						<MicrophoneHint />
					</div>
				{/if}
			</div>
		{/snippet}
		{#snippet trackComponent({ symbols, correctSymbols, validateSymbolClick })}
			<SymbolTrack
				{symbols}
				{correctSymbols}
				{validateSymbolClick}
				letterSpacing={4}
				flattenRows={true}
				splitFiller={true}
			/>
		{/snippet}
	</TrackLevel>
{/if}
