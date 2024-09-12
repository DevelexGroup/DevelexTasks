<script>
	import ButtonStartLesson from '$lib/components/ButtonStartLesson.svelte';
</script>

<div class="flex flex-col items-center justify-center space-y-4">
	<h1 class="text-3xl font-bold">Syllables</h1>
	<p>Choose your level:</p>
	<div class="flex flex-col items-center justify-center space-y-4">
		<ButtonStartLesson href="/lesson/syllables/zero">Level Zero</ButtonStartLesson>
		<ButtonStartLesson href="/lesson/syllables/one">Level One</ButtonStartLesson>
		<ButtonStartLesson href="/lesson/syllables/two">Level Two</ButtonStartLesson>
		<ButtonStartLesson href="/lesson/syllables/three">Level Three</ButtonStartLesson>
		<ButtonStartLesson href="/lesson/syllables/four">Level Four</ButtonStartLesson>
	</div>
</div>
