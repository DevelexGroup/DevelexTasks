<script lang="ts">
	import TrackLevel from '$lib/components/common/TrackLevel.svelte';
	import { taskStage } from '$lib/stores/task';
	import { TaskStage, type TrackLevelState } from '$lib/types/task.types';
	import { id, rawData, validateSymbol, validateStage, isSyllableFrameVisible	} from '$lib/components/tasks/cibule/levels/3b/index';
	import CibuleSyllableFrame from '$lib/components/tasks/cibule/components/CibuleSyllableFrame.svelte';
	import SymbolTrack from '$lib/components/common/tracks/SymbolTrack.svelte';
	import { getCibuleLevelData } from '$lib/components/tasks/cibule/utils/levelLoader';
	import { cibuleLevelPreset } from '$lib/components/tasks/cibule';
	import { getContext } from 'svelte';
	import { AnalyticsManager } from '$lib/utils/analyticsManager';
	import { ANALYTICS_MANAGER_KEY } from '$lib/types/general.types';
	import { tryReadWordFromState } from '$lib/utils/trackLevelUtils';
	import { playSound, SOUND_MISTAKE } from '$lib/utils/sound';

	const preset = cibuleLevelPreset.find((level => level.levelID === id))?.content;
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
<TrackLevel {id} data={data} {validateSymbol} {validateStage} onCompleted={() => {taskStage.set(TaskStage.End)}} onSpace={onSpace}>
	{#snippet extraComponent({ state })}
		<div class="flex gap-4">
			{#each state.dataEntry.correct as syllable, index (index)}
				<CibuleSyllableFrame {syllable} visible={isSyllableFrameVisible(state, syllable, index)} />
			{/each}
		</div>
	{/snippet}
	{#snippet trackComponent({ symbols, correctSymbols, validateSymbolClick })}
		<SymbolTrack {symbols} {correctSymbols} {validateSymbolClick} letterSpacing={4} flattenRows={true} splitFiller={true} />
	{/snippet}
</TrackLevel>
{/if}