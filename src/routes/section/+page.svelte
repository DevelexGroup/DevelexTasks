<script>
	import { resolveAny } from '$lib/utils/resolveAny';
	import Button from '$lib/components/Button.svelte';
</script>

<div class="flex flex-col items-center justify-center space-y-4">
	<h1 class="text-3xl font-bold">Lesson Selection</h1>
	<p>Choose type of lesson:</p>
	<div class="flex flex-col items-center justify-center space-y-4">
		<Button href={resolveAny('/section/paired-reading')}>Dublované čtení</Button>
		<Button href={resolveAny('/section/syllables')}>Slabiky</Button>
		<Button href={resolveAny('/section/cibule')}>Cibule</Button>
		<Button href={resolveAny('/section/visual-diff')}>Baseline - Zraková difereciace</Button>
		<Button href={resolveAny('/section/fonologic')}
			>Baseline - Fonologické uvědomění a manipulace</Button
		>
	</div>
	<a
		href={resolveAny('/settings')}
		class="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
	>
		Nastavení
	</a>
</div>
