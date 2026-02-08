<script lang="ts">
	import {
		debugMode,
		debugOptions,
		debugWindowOpenKey,
		debugWindowVisible
	} from '$lib/stores/debug';
	import { onMount } from 'svelte';

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === debugWindowOpenKey) {
			debugWindowVisible.update((v) => !v);
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

{#if $debugWindowVisible}
	<div
		class="fixed top-4 right-4 z-50 min-w-64 rounded-lg border border-gray-300 bg-white p-4 shadow-lg"
	>
		<div class="mb-3 flex items-center justify-between">
			<h3 class="text-lg font-semibold text-gray-800">Debug Window</h3>
			<button
				class="text-gray-500 hover:text-gray-700"
				onclick={() => debugWindowVisible.set(false)}
			>
				✕
			</button>
		</div>

		<div class="mb-3 border-b border-gray-200 pb-3">
			<label class="flex cursor-pointer items-center gap-2">
				<input
					type="checkbox"
					checked={$debugMode}
					onchange={(e) => debugMode.set(e.currentTarget.checked)}
					class="h-4 w-4 accent-blue-600"
				/>
				<span class="font-medium text-gray-700">Enable Debug Mode</span>
			</label>
		</div>

		{#if $debugMode}
			<div class="space-y-3">
				<h4 class="text-sm font-medium text-gray-600">Debug Options</h4>

				<label class="flex cursor-pointer items-center gap-2">
					<input
						type="checkbox"
						checked={$debugOptions.debugAOIAreaVisible}
						onchange={(e) =>
							debugOptions.update((opts) => ({
								...opts,
								debugAOIAreaVisible: e.currentTarget.checked
							}))}
						class="h-4 w-4 accent-blue-600"
					/>
					<span class="text-sm text-gray-700">Show AOI Areas</span>
				</label>

				<div class="flex flex-col gap-1">
					<label class="text-sm text-gray-700" for="bufferSize">
						AOI Buffer Size <small>(Only visual)</small>:
						<input
							class="rounded-md border border-gray-300 px-2 py-1"
							type="number"
							bind:value={$debugOptions.debugAOIBufferSize}
						/>
					</label>
					<input
						id="bufferSize"
						type="range"
						min="0"
						max="500"
						value={$debugOptions.debugAOIBufferSize}
						oninput={(e) =>
							debugOptions.update((opts) => ({
								...opts,
								debugAOIBufferSize: parseInt(e.currentTarget.value)
							}))}
						class="w-full"
					/>
				</div>
			</div>
		{/if}

		<div class="mt-4 border-t border-gray-200 pt-3 text-xs text-gray-500">
			Press {debugWindowOpenKey} to toggle
		</div>
	</div>
{/if}
