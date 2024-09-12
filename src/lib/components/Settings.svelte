<script lang="ts">
	import type { GazeInputConfig, GazeInputConfigWithFixations } from '@473783/develex-core';
	import SettingsGazeInput from './SettingsGazeInput.svelte';
	import { inputCreationConfig } from '$lib/stores/gazeConfig';

	const handleGazeInputSetup = (event: CustomEvent<GazeInputConfig>) => {
		const config = event.detail as GazeInputConfigWithFixations;
		inputCreationConfig.set(config);
	};
</script>

<h1 class="mb-4 text-2xl font-bold">Settings</h1>
<SettingsGazeInput on:gazeInputSetup={handleGazeInputSetup} />
<a href="/section" class="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700">
	Back to sections
</a>
