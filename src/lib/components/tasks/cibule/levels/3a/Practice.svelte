<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage, type TrackLevelState } from '$lib/types/task.types';
	import { id, rawData, validateSymbol, validateStage } from '$lib/components/tasks/cibule/levels/3a/index';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import { getCibuleLevelData } from '$lib/components/tasks/cibule/utils/levelLoader';
	import { cibuleLevelPreset } from '$lib/components/tasks/cibule';
	import { AnalyticsManager } from '$lib/utils/analyticsManager';
	import { ANALYTICS_MANAGER_KEY } from '$lib/types/general.types';
	import { getContext } from 'svelte';
	import { tryReadWordFromState } from '$lib/utils/trackLevelUtils';
	import { playSound, SOUND_MISTAKE } from '$lib/utils/sound';

	const preset = cibuleLevelPreset.find((level => level.levelID === id))?.practiceContent;
	const data = preset ? getCibuleLevelData(preset, rawData) : null;

	const analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);

	function onSpace(state: TrackLevelState) {
		if (validateStage(state) === true)
			tryReadWordFromState(state, analyticsManager);
		else {
			playSound(SOUND_MISTAKE, 0.33);
		}
	}
</script>

{#if data}
<TrackLevel {id} data={data} {validateSymbol} {validateStage} isPractice={true} onCompleted={() => {taskStage.set(TaskStage.Instructions)}} onSpace={onSpace}>
	{#snippet trackComponent({ symbols, correctSymbols, validateSymbolClick })}
		<SymbolTrack {symbols} {correctSymbols} {validateSymbolClick} letterSpacing={4} flattenRows={true} splitFiller={true} />
	{/snippet}
</TrackLevel>
{/if}