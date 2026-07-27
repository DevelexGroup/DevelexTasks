<script lang="ts">
	import PairedReadingSentenceListLevel from '$lib/components/tasks/paired-reading/components/PairedReadingSentenceListLevel.svelte';
	import {
		LEVEL_3_SENTENCES_PER_LIST,
		formatPairedReadingSentenceRawData,
		pairedReadingLevelPreset
	} from '$lib/components/tasks/paired-reading';
	import type { PairedReadingRawDataEntry } from '$lib/components/tasks/paired-reading/paired-reading.types';
	import { id, taskRawData } from '$lib/components/tasks/paired-reading/levels/3';
	import type { TrackTaskPreset } from '$lib/types/task.types';
	import { getLevelData } from '$lib/utils/trackLevelUtils';

	interface Props {
		taskPreset?: TrackTaskPreset<PairedReadingRawDataEntry>;
		excludeTags?: string[];
	}

	let { taskPreset = pairedReadingLevelPreset, excludeTags }: Props = $props();

	const levelPreset = taskPreset.find((level) => level.levelID === id)?.content;
	const data = levelPreset
		? getLevelData(levelPreset, taskRawData, formatPairedReadingSentenceRawData, excludeTags)
		: null;
</script>

{#if data}
	<PairedReadingSentenceListLevel {id} {data} sentencesPerList={LEVEL_3_SENTENCES_PER_LIST} />
{/if}
