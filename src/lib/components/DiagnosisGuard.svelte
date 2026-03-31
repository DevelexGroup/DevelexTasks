<script lang="ts">
	import { isDiagnosisMode } from '$lib/stores/diagnosis';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import DiagnosisDialog from '$lib/components/DiagnosisDialog.svelte';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	let showDialog = $state(false);

	onMount(() => {
		if (!$isDiagnosisMode) {
			showDialog = true;
		}
	});

	function handleClose() {
		goto(resolve('/'));
	}

	function handleOpenChange(v: boolean) {
		if (!v) handleClose();
	}
</script>

{#if $isDiagnosisMode}
	{@render children?.()}
{:else}
	<DiagnosisDialog
		open={showDialog}
		onOpenChange={handleOpenChange}
		onClose={handleClose}
		cancelText="Zpět"
	/>

	<div class="pointer-events-none opacity-20 blur-sm flex items-center justify-center min-h-[50vh]">
		<span>Chráněný obsah</span>
	</div>
{/if}