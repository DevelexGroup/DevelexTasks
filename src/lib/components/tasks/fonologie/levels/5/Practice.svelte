<script lang="ts">
	import FonologieLevel from '$lib/components/tasks/fonologie/components/FonologieLevel.svelte';
	import { id, rawData } from './index';
	import type { TrackTaskPreset } from '$lib/types/task.types';
	import type { FonologieTaskRawDataEntry } from '$lib/components/tasks/fonologie/fonologie.types';
	import { fonologieLevelPreset } from '$lib/components/tasks/fonologie';
	interface Props {
		taskPreset?: TrackTaskPreset<FonologieTaskRawDataEntry>
	}

	let { taskPreset = fonologieLevelPreset }: Props = $props();
</script>

<FonologieLevel {id} {rawData} {taskPreset} isPractice={true} useCategories={false} />
