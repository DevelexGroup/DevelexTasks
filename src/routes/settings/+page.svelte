<script lang="ts">
	import { GAZE_INPUT_CONFIGS, trackerConfig } from '$lib/stores/tracker';
	import { isDiagnosisMode } from '$lib/stores/diagnosis';
	import DiagnosisDialog from '$lib/components/DiagnosisDialog.svelte';

	let showDialog = $state(false);
</script>

<div class="flex h-screen w-full flex-col items-center justify-center">
	<h3 class="text-lg text-shadow-gray-800">Nastavení</h3>

	<div class="mt-8 flex flex-col">
		<label for="eyetracker" class="mb-1 text-sm font-semibold text-gray-700"
			>Vyber si eyetracker</label
		>

		<select
			id="eyetracker"
			bind:value={$trackerConfig}
			class="rounded-md border border-gray-300 px-3 py-1.5 capitalize"
		>
			<option value="" disabled class="normal-case">Vyber si možnost</option>

			{#each Object.entries(GAZE_INPUT_CONFIGS) as [key, value] (key)}
				<option value={key} class="capitalize" selected={key === $trackerConfig}>
					{value.tracker} - {value.fixationDetection}
				</option>
			{/each}
		</select>
	</div>

	<button
		class="mt-8 rounded-md bg-blue-500 px-4 py-2 text-white"
		onclick={() => window.history.back()}
	>
		Zpět
	</button>

	{#if !$isDiagnosisMode}
		<button
			class="mt-4 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-800 hover:bg-gray-100"
			onclick={() => (showDialog = true)}
		>
			Aktivovat diagnostický režim
		</button>
	{:else}
		<div class="mt-4 flex flex-col items-center gap-2">
			<p class="text-sm font-medium text-green-600">Diagnostický režim aktivní</p>
			<button
				class="rounded-md border border-red-300 bg-white px-4 py-2 text-red-600 hover:bg-red-50"
				onclick={() => ($isDiagnosisMode = false)}
			>
				Deaktivovat diagnostický režim
			</button>
		</div>
	{/if}
</div>

<DiagnosisDialog
	open={showDialog}
	onOpenChange={(v) => (showDialog = v)}
	onClose={() => (showDialog = false)}
	cancelText="Zrušit"
	/>
