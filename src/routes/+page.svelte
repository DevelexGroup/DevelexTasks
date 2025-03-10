<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import DwellEye from '$lib/components/DwellEye.svelte';
	import DwellEyePupil from '$lib/components/DwellEyePupil.svelte';

	let primaryColor = '#50C878';
</script>

<img src="/img/peacock.png" alt="Logo" class="mx-auto h-24 w-auto" />
<h1 class="mb-12 text-center text-4xl font-bold text-neutral-600">Develex</h1>
<div class="flex flex-col gap-1">
	<Button href="/section/paired-reading">Dublované čtení</Button>
	<Button href="/section/cibule">Cibule</Button>
	<Button href="/section/syllables">Slabiky</Button>
	<Button href="/section/visual-diff">Baseline - Zraková difereciace</Button>
	<Button href="/section/fonologic">Baseline - Fonologické uvědomění a manipulace</Button>
	<div class="mt-4 flex flex-col gap-1">
		<Button href="/settings">Změnit zařízení</Button>
		<Button href="/download">Stáhnout data</Button>
	</div>
	<select class="mt-4" bind:value={primaryColor}>
		<option value="#50C878">Green</option>
		<option value="#808080">Gray</option>
		<option value="#0000FF">Blue</option>
		<option value="#FF0000">Red</option>
		<option value="#FFFF00">Yellow</option>
	</select>
	<div class="flex flex-col gap-1">
		<DwellEyePupil {primaryColor} />
		<DwellEye pupilColor={primaryColor} />
	</div>
</div>
