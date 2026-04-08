<script lang="ts">
	import FonologieLevel from '$lib/components/tasks/fonologie/components/FonologieLevel.svelte';
	import { id, rawData } from './index';
	import type { TrackTaskPreset } from '$lib/types/task.types';
	import type { FonologieTaskRawDataEntry } from '$lib/components/tasks/fonologie/fonologie.types';
	import { fonologieLevelPreset } from '$lib/components/tasks/fonologie';
	interface Props {
		taskPreset?: TrackTaskPreset<FonologieTaskRawDataEntry>
		excludeTags?: string[]
		mode?: string
	}

	let {
		taskPreset = fonologieLevelPreset,
		excludeTags,
		mode
	 }: Props = $props();
</script>

<FonologieLevel {id} {rawData} {taskPreset} {excludeTags} isPractice={false} useCategories={mode !== 'evaluation'} showShowcaseTitle={true} />
