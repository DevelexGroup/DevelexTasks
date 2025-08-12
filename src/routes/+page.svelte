<script lang="ts">
	import { resolveAny } from '$lib/utils/resolveAny';
	import Button from '$lib/components/Button.svelte';
</script>

<img src={resolveAny('/img/peacock.png')} alt="Logo" class="mx-auto h-24 w-auto" />
<h1 class="mb-12 text-center text-4xl font-bold text-neutral-600">Develex</h1>
<div class="flex flex-col gap-1">
	<Button href={resolveAny('/section/paired-reading')}>Dublované čtení</Button>
	<Button href={resolveAny('/section/cibule')}>Cibule</Button>
	<Button href={resolveAny('/section/syllables')}>Slabiky</Button>
	<Button href={resolveAny('/section/visual-diff')}>Baseline - Zraková difereciace</Button>
	<Button href={resolveAny('/section/fonologic')}>
		Baseline - Fonologické uvědomění a manipulace
	</Button>
	<Button href={resolveAny('/section/meaningful-text')}>Meaningful Text</Button>
	<div class="mt-4 flex flex-col gap-1">
		<Button href={resolveAny('/settings')}>Změnit zařízení</Button>
		<Button href={resolveAny('/validate')}>Validace</Button>
		<Button href={resolveAny('/download')}>Stáhnout data</Button>
	</div>
</div>
