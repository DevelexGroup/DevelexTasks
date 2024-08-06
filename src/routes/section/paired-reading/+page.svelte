<script>
	import ButtonStartLesson from '$lib/components/ButtonStartLesson.svelte';
</script>

<div class="flex flex-col items-center justify-center space-y-4">
	<h1 class="text-3xl font-bold">Paired Reading</h1>
	<p>Choose your level:</p>
	<div class="flex flex-col items-center justify-center space-y-4">
		<ButtonStartLesson href="/lesson/paired-reading/zero">Level Zero</ButtonStartLesson>
		<ButtonStartLesson href="/lesson/paired-reading/zero-voice">Level Zero Voice</ButtonStartLesson>
		<ButtonStartLesson href="/lesson/paired-reading/one">Level One</ButtonStartLesson>
		<ButtonStartLesson href="/lesson/paired-reading/two">Level Two</ButtonStartLesson>
		<ButtonStartLesson href="/lesson/paired-reading/three">Level Three</ButtonStartLesson>
		<ButtonStartLesson href="/lesson/paired-reading/four">Level Four</ButtonStartLesson>
	</div>
</div>
