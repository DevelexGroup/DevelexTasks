<script lang="ts">
	import type { GazeInputConfig, GazeInputConfigWithFixations } from 'develex-js-sdk';
	import SettingsGazeInput from './SettingsGazeInput.svelte';
	import { inputCreationConfig } from '$lib/stores/gazeConfig';
	import Button from './Button.svelte';
	import { resolveAny } from '$lib/utils/resolveAny';

	const handleGazeInputSetup = (event: CustomEvent<GazeInputConfig>) => {
		const config = event.detail as GazeInputConfigWithFixations;
		inputCreationConfig.set(config);
	};
</script>

<h1 class="mb-4 text-2xl font-bold">Settings</h1>
<SettingsGazeInput on:gazeInputSetup={handleGazeInputSetup} />
<Button href={resolveAny('/')}>Back</Button>
