<script lang="ts">
	import Lesson from '$lib/components/Lesson.svelte';
	import LessonFramePairedReading0a from '$lib/components/LessonFramePairedReading0a.svelte';
</script>

<Lesson let:gazeInput>
	<LessonFramePairedReading0a {gazeInput} />
</Lesson>
