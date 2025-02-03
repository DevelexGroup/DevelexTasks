<script>
	import Button from '$lib/components/Button.svelte';
</script>

<div class="flex flex-col items-center justify-center space-y-4">
	<h1 class="text-3xl font-bold">Lesson Selection</h1>
	<p>Choose type of lesson:</p>
	<div class="flex flex-col items-center justify-center space-y-4">
		<Button href="/section/paired-reading">Dublované čtení</Button>
		<Button href="/section/syllables">Slabiky</Button>
		<Button href="/section/cibule">Cibule</Button>
	</div>
	<a href="/settings" class="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700">
		Settings
	</a>
</div>
