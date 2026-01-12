<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { type TaskMistake, TaskStage, type TrackLevelState } from '$lib/types/task.types';
	import { id, rawData, validateSymbol, validateStage } from '$lib/components/tasks/cibule/levels/3a/index';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import { getCibuleLevelData } from '$lib/components/tasks/cibule/utils/levelLoader';
	import { cibuleLevelPreset } from '$lib/components/tasks/cibule';
	import { AnalyticsManager } from '$lib/utils/analyticsManager';
	import { ANALYTICS_MANAGER_KEY } from '$lib/types/general.types';
	import { getContext } from 'svelte';
	import { tryReadWordFromState } from '$lib/utils/trackLevelUtils';
	import { playSound, SOUND_MISTAKE } from '$lib/utils/sound';
	import { MistakeUnfinished } from '$lib/types/mistakes.types';

	const preset = cibuleLevelPreset.find((level => level.levelID === id))?.practiceContent;
	const data = preset ? getCibuleLevelData(preset, rawData) : null;

	const analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);

	let spacePressed = false;

	function onSpace(state: TrackLevelState) {
		if (validateStage(state) === true) {
			tryReadWordFromState(state, analyticsManager);
			spacePressed = true;
		}
		else {
			playSound(SOUND_MISTAKE, 0.33);
		}
	}

	function validateStageWithSpace(state: TrackLevelState): true | TaskMistake[] {
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
<TrackLevel {id} data={data} {validateSymbol} validateStage={validateStageWithSpace} isPractice={true} onCompleted={() => {taskStage.set(TaskStage.Instructions)}} onSpace={onSpace} onStageAdvance={resetSpacePressed}>
	{#snippet trackComponent({ symbols, correctSymbols, validateSymbolClick })}
		<SymbolTrack {symbols} {correctSymbols} {validateSymbolClick} letterSpacing={4} flattenRows={true} splitFiller={true} />
	{/snippet}
</TrackLevel>
{/if}