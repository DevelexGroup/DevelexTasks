<script lang="ts">
	import FonologieLevel from '$lib/components/tasks/fonologie/components/FonologieLevel.svelte';
	import { id, rawData } from './index';
	import type { TrackTaskPreset } from '$lib/types/task.types';
	import { fonologieLevelPreset } from '$lib/components/tasks/fonologie';
	import type { FonologieTaskRawDataEntry } from '$lib/components/tasks/fonologie/fonologie.types';

	interface Props {
		taskPreset?: TrackTaskPreset<FonologieTaskRawDataEntry>
		excludeTags?: string[]
		useCategories?: boolean
	}

	let {
		taskPreset = fonologieLevelPreset,
		excludeTags,
		useCategories = true
	}: Props = $props();
</script>

<FonologieLevel {id} {rawData} {taskPreset} {excludeTags} isPractice={true} {useCategories} showShowcaseTitle={true} />
