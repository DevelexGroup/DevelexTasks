<script lang="ts">
	import { version } from '$app/environment';
	import * as Dialog from '$lib/components/ui/dialog';
	import { SELECTABLE_GAZE_INPUT_CONFIGS, trackerConfig } from '$lib/stores/tracker';
	import { isDiagnosisMode } from '$lib/stores/diagnosis';
	import DiagnosisDialog from '$lib/components/DiagnosisDialog.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Lock } from '@lucide/svelte';

	interface Props {
		open: boolean;
		onOpenChange: (open: boolean) => void;
	}

	let { open, onOpenChange }: Props = $props();

	const versionParts = version.split('-');
	const gitHash = versionParts.pop();
	const appVersion = versionParts.join('-');

	let showPasswordDialog = $state(false);
	let visualChecked = $state($isDiagnosisMode);

	$effect(() => {
		if (open) {
			visualChecked = $isDiagnosisMode;
		}
	});

	function onCheckedChange(checked: boolean) {
		visualChecked = checked;
		if (checked) {
			if (!$isDiagnosisMode) {
				showPasswordDialog = true;
			}
		} else {
			$isDiagnosisMode = false;
		}
	}
</script>

<Dialog.Root {open} {onOpenChange}>
	<Dialog.Content class="gap-0">
		<Dialog.Header class="mb-4">
			<Dialog.Title>Nastavení</Dialog.Title>
		</Dialog.Header>

		<div class="divide-y divide-gray-200 border-y border-gray-200">
			<div class="flex items-center justify-between gap-4 py-3">
				<label for="eyetracker" class="text-sm font-semibold text-gray-700">Eyetracker</label>

				<select
					id="eyetracker"
					bind:value={$trackerConfig}
					class="w-56 rounded-md border border-gray-300 px-3 py-1.5 text-sm capitalize"
				>
					<option value="" disabled class="normal-case">Vyber si možnost</option>

					{#each Object.entries(SELECTABLE_GAZE_INPUT_CONFIGS) as [key, value] (key)}
						<option value={key} class="capitalize">
							{value.tracker} - {value.fixationDetection}
						</option>
					{/each}
				</select>
			</div>

			<div class="flex items-center justify-between gap-4 py-3">
				<Label
					for="diagnosis-mode"
					class="flex items-center gap-2 text-sm font-semibold text-gray-700"
				>
					Diagnostický režim
					<Lock class="h-4 w-4" />
				</Label>

				<div class="flex w-56 justify-end">
					<Switch id="diagnosis-mode" bind:checked={visualChecked} {onCheckedChange} />
				</div>
			</div>
		</div>

		<p class="mt-6 text-right text-xs text-gray-400">
			DeveLex - v{appVersion}
			<span class="font-mono">({gitHash})</span>
		</p>
	</Dialog.Content>
</Dialog.Root>

<DiagnosisDialog
	open={showPasswordDialog}
	onOpenChange={(v) => {
		showPasswordDialog = v;
		if (!v && !$isDiagnosisMode) {
			visualChecked = false;
		}
	}}
	onClose={() => {
		showPasswordDialog = false;
		if (!$isDiagnosisMode) {
			visualChecked = false;
		}
	}}
	cancelText="Zrušit"
/>
