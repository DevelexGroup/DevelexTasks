<script lang="ts">
	import { GAZE_INPUT_CONFIGS, trackerConfig } from '$lib/stores/tracker';
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
</div>
