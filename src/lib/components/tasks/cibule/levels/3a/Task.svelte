<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { type TaskMistake, TaskStage, type TrackTaskState } from '$lib/types/task.types';
	import { id, validateSymbol, validateStage, rawData } from '$lib/components/tasks/cibule/levels/3a/index';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import { getCibuleLevelData } from '$lib/components/tasks/cibule/utils/levelLoader';
	import { calculateFluencyScore, cibuleLevelPreset } from '$lib/components/tasks/cibule';
	import { getContext } from 'svelte';
	import { fade } from 'svelte/transition';
	import { AnalyticsManager } from '$lib/utils/analyticsManager';
	import { ANALYTICS_MANAGER_KEY } from '$lib/types/general.types';
	import { tryReadWordFromState } from '$lib/utils/trackLevelUtils';
	import { playSound, SOUND_MISTAKE } from '$lib/utils/sound';
	import { MistakeUnfinished } from '$lib/types/mistakes.types';
	import MicrophoneHint from '$lib/components/common/MicrophoneHint.svelte';

	const preset = cibuleLevelPreset.find((level => level.levelID === id))?.content;
	const data = preset ? getCibuleLevelData(preset, rawData) : null;

	const analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);

	let spacePressed = false;

	function onSpace(state: TrackTaskState) {
		if (validateStage(state) === true) {
			tryReadWordFromState(state, analyticsManager);
			spacePressed = true;
		}
		else {
			playSound(SOUND_MISTAKE, 0.33);
		}
	}

	function validateStageWithSpace(state: TrackTaskState): true | TaskMistake[] {
		if (spacePressed) {
			return validateStage(state);
		}
		return [MistakeUnfinished]
	}

	function resetSpacePressed() {
		spacePressed = false;
	}
</script>

{#if data}
<TrackLevel {id} data={data} {validateSymbol} validateStage={validateStageWithSpace} calculateFluencyScore={calculateFluencyScore} onCompleted={() => {taskStage.set(TaskStage.End)}} onSpace={onSpace} onStageAdvance={resetSpacePressed}>
	{#snippet trackComponent({ symbols, correctSymbols, validateSymbolClick })}
		<SymbolTrack {symbols} {correctSymbols} {validateSymbolClick} letterSpacing={4} flattenRows={true} splitFiller={true} />
	{/snippet}
	{#snippet extraComponent({ state, isPractice })}
		{#if validateStage(state) === true && !spacePressed}
			<div class="absolute pointer-events-none bottom-16 left-1/2 -translate-x-1/2" in:fade|global={{ delay: 1000 }} out:fade|global>
				<MicrophoneHint />
			</div>
		{/if}
	{/snippet}
</TrackLevel>
{/if}