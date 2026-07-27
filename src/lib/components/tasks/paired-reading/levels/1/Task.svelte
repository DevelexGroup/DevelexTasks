<script lang="ts">
	import PairedReadingLevel from '$lib/components/tasks/paired-reading/components/PairedReadingLevel.svelte';
	import {
		formatPairedReadingRawData,
		pairedReadingLevelPreset
	} from '$lib/components/tasks/paired-reading';
	import type { PairedReadingRawDataEntry } from '$lib/components/tasks/paired-reading/paired-reading.types';
	import { id, taskRawData } from '$lib/components/tasks/paired-reading/levels/1';
	import type { TrackTaskPreset } from '$lib/types/task.types';
	import { getLevelData } from '$lib/utils/trackLevelUtils';

	interface Props {
		taskPreset?: TrackTaskPreset<PairedReadingRawDataEntry>;
		excludeTags?: string[];
	}

	let { taskPreset = pairedReadingLevelPreset, excludeTags }: Props = $props();

	const levelPreset = taskPreset.find((level) => level.levelID === id)?.content;
	const data = levelPreset
		? getLevelData(levelPreset, taskRawData, formatPairedReadingRawData, excludeTags)
		: null;
</script>

{#if data}
	<PairedReadingLevel {id} {data} />
{/if}
