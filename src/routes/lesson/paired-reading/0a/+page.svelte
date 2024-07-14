<script lang="ts">
	import Lesson from '$lib/components/Lesson.svelte';
	import LessonFramePairedReading0a from '$lib/components/LessonFramePairedReading0a.svelte';
	import type { GazeInputConfigWithFixations } from '@473783/develex-core';
	import type { GazeInput } from '@473783/develex-core';

	export let gazeInput: GazeInput<GazeInputConfigWithFixations>;
</script>

<Lesson>
	<LessonFramePairedReading0a {gazeInput} />
</Lesson>
