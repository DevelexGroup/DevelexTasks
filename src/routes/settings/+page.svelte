<script lang="ts">
	import { GAZE_INPUT_CONFIGS, trackerConfig, samplingMode, SamplingMode, SAMPLING_MODE_LABELS } from '$lib/stores/tracker';
	import { isDiagnosisMode } from '$lib/stores/diagnosis';
	import DiagnosisDialog from '$lib/components/DiagnosisDialog.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Lock } from '@lucide/svelte';

	let showDialog = $state(false);
	let visualChecked = $state($isDiagnosisMode);

	function onCheckedChange(checked: boolean) {
		visualChecked = checked;
		if (checked) {
			if (!$isDiagnosisMode) {
				showDialog = true;
			}
		} else {
			$isDiagnosisMode = false;
		}
	}
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

	<div class="mt-4 flex flex-col">
		<label for="sampling-mode" class="mb-1 text-sm font-semibold text-gray-700"
			>Režim vzorkování</label
		>

		<select
			id="sampling-mode"
			bind:value={$samplingMode}
			class="rounded-md border border-gray-300 px-3 py-1.5"
		>
			{#each Object.values(SamplingMode) as mode (mode)}
				<option value={mode} selected={mode === $samplingMode}>
					{SAMPLING_MODE_LABELS[mode]}
				</option>
			{/each}
		</select>
	</div>

	<div class="mt-8 flex items-center space-x-2">
		<Switch
			id="diagnosis-mode"
			bind:checked={visualChecked}
			onCheckedChange={onCheckedChange}
		/>
		<Label for="diagnosis-mode" class="flex items-center gap-2">
			Diagnostický režim
			<Lock class="h-4 w-4" />
		</Label>
	</div>

	<!-- separator --> <div class="my-8 h-px w-40 bg-gray-300"></div>

	<button
		class="rounded-md bg-blue-500 px-4 py-2 text-white"
		onclick={() => window.history.back()}
	>
		Zpět
	</button>
</div>

<DiagnosisDialog
	open={showDialog}
	onOpenChange={(v) => {
		showDialog = v;
		if (!v && !$isDiagnosisMode) {
			visualChecked = false;
		}
	}}
	onClose={() => {
		showDialog = false;
		if (!$isDiagnosisMode) {
			visualChecked = false;
		}
	}}
	cancelText="Zrušit"
/>
