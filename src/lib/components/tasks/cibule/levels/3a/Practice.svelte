<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { type TaskMistake, TaskStage, type TrackTaskState } from '$lib/types/task.types';
	import {
		id,
		rawData,
		validateSymbol,
		validateStage
	} from '$lib/components/tasks/cibule/levels/3a/index';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import { cibuleLevelPreset, formatCibuleRawData } from '$lib/components/tasks/cibule';
	import { AnalyticsManager } from '$lib/utils/analyticsManager';
	import { ANALYTICS_MANAGER_KEY } from '$lib/types/general.types';
	import { getContext } from 'svelte';
	import { fade } from 'svelte/transition';
	import { getLevelData, tryReadWordFromState } from '$lib/utils/trackLevelUtils';
	import { playSound, SOUND_MISTAKE } from '$lib/utils/sound';
	import { MistakeUnfinished } from '$lib/types/mistakes.types';
	import MicrophoneHint from '$lib/components/common/MicrophoneHint.svelte';
	import type { CibuleRawDataEntry } from '$lib/components/tasks/cibule/cibule.types';

	const preset = cibuleLevelPreset.find((level) => level.levelID === id)?.practiceContent;
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
		isPractice={true}
		onCompleted={() => {
			taskStage.set(TaskStage.Instructions);
		}}
		{onSpace}
		onStageAdvance={resetSpacePressed}
	>
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
		{#snippet extraComponent({ state, isPractice })}
			{#if validateStage(state) === true && !spacePressed}
				<div
					class="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2"
					in:fade|global={{ delay: 1000 }}
					out:fade|global
				>
					<MicrophoneHint />
				</div>
			{/if}
		{/snippet}
	</TrackLevel>
{/if}
