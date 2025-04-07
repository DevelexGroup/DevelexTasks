<script>
	import ButtonStartLesson from '$lib/components/ButtonStartLesson.svelte';
</script>

<div class="flex flex-col items-center justify-center space-y-4">
	<h1 class="text-3xl font-bold">Debug Paired Reading</h1>
	<p>Vyber si úroveň:</p>
	<div class="flex flex-col items-center justify-center space-y-4">
		<ButtonStartLesson href="/debug-lesson/paired-reading/zero">Level Zero</ButtonStartLesson>
		<ButtonStartLesson href="/debug-lesson/paired-reading/zero-voice"
			>Level Zero Voice</ButtonStartLesson
		>
		<ButtonStartLesson href="/debug-lesson/paired-reading/one">Level One</ButtonStartLesson>
		<ButtonStartLesson href="/debug-lesson/paired-reading/two">Level Two</ButtonStartLesson>
		<ButtonStartLesson href="/debug-lesson/paired-reading/three">Level Three</ButtonStartLesson>
		<ButtonStartLesson href="/debug-lesson/paired-reading/four">Level Four</ButtonStartLesson>
	</div>
</div>
