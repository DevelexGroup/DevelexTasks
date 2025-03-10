<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import DwellTarget from '$lib/components/DwellTarget.svelte';
	import DwellEye from '$lib/components/DwellTargetEye.svelte';
	import DwellEyePupil from '$lib/components/DwellTargetEyePupil.svelte';

	type DwellState = 'active' | 'disabled' | 'activeDwelling';
	let primaryColor = '#50C878';
	let pupilProportion = 0.32;
	let dwellState: DwellState = 'active';
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
	<select class="mt-4" bind:value={dwellState}>
		<option value="active">Active</option>
		<option value="disabled">Disabled</option>
		<option value="activeDwelling">Active Dwelling</option>
	</select>
	<div class="flex flex-col gap-1">
		<DwellTarget {dwellState} />
	</div>
</div>
