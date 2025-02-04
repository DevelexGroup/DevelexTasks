<script>
	import Button from './Button.svelte';
	import DownloadSessionTable from './DownloadSessionTable.svelte';
	import { browser } from '$app/environment';
</script>

<h1 class="mb-4 text-2xl font-bold">Stáhnout data</h1>
{#if browser}
	<DownloadSessionTable />
{:else}
	<p>Loading...</p>
{/if}
<Button href="/">Zpět</Button>
