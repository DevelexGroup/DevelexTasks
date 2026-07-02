<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import type { StimulusExportPipeline } from '$lib/utils/stimulusExport/exportPipeline.svelte';

	interface Props {
		open?: boolean;
		pipeline: StimulusExportPipeline;
	}

	let { open = $bindable(false), pipeline }: Props = $props();

	const done = $derived(pipeline.completed + pipeline.failed);
	const percent = $derived(pipeline.total > 0 ? Math.round((done / pipeline.total) * 100) : 0);

	function formatEta(ms: number | null): string {
		if (ms === null) return '—';
		const totalSeconds = Math.round(ms / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;
		if (hours > 0) return `${hours} h ${minutes} min`;
		if (minutes > 0) return `${minutes} min ${seconds} s`;
		return `${seconds} s`;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="sm:max-w-lg"
		showCloseButton={!pipeline.running}
		interactOutsideBehavior="ignore"
		escapeKeydownBehavior={pipeline.running ? 'ignore' : 'close'}
	>
		<Dialog.Header>
			<Dialog.Title>
				{#if pipeline.running}
					Exportuji stimuly…
				{:else if pipeline.cancelled}
					Export zrušen
				{:else}
					Export dokončen
				{/if}
			</Dialog.Title>
			<Dialog.Description>
				{done} / {pipeline.total} souborů
				{#if pipeline.warned > 0}
					· {pipeline.warned} s varováním
				{/if}
				{#if pipeline.failed > 0}
					· {pipeline.failed} selhalo
				{/if}
				{#if pipeline.running}
					· zbývá ~{formatEta(pipeline.etaMs)}
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div class="flex flex-col gap-3">
			<div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
				<div
					class="h-full rounded-full bg-blue-600 transition-[width] duration-300"
					style="width: {percent}%"
				></div>
			</div>

			{#if pipeline.currentPath}
				<p class="truncate font-mono text-xs text-gray-500">{pipeline.currentPath}</p>
			{/if}

			{#if pipeline.recent.length > 0}
				<div class="max-h-40 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-2">
					{#each pipeline.recent.slice().reverse() as file, i (pipeline.recent.length - i)}
						<div class="flex items-center gap-2 font-mono text-xs">
							{#if file.status === 'ok'}
								<span class="text-green-600">✓</span>
							{:else if file.status === 'warning'}
								<span class="text-amber-600">!</span>
							{:else}
								<span class="text-red-600">✕</span>
							{/if}
							<span class="truncate text-gray-700">{file.path}</span>
						</div>
					{/each}
				</div>
			{/if}

			{#if pipeline.errors.length > 0}
				<div class="max-h-32 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-2">
					<p class="mb-1 text-xs font-semibold text-red-700">Chyby:</p>
					{#each pipeline.errors as file (file.path)}
						<p class="truncate font-mono text-xs text-red-700">
							{file.path}{file.detail ? ` — ${file.detail}` : ''}
						</p>
					{/each}
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			{#if pipeline.running}
				<Button
					variant="destructive"
					onclick={() => pipeline.cancel()}
					disabled={pipeline.cancelled}
				>
					{pipeline.cancelled ? 'Ruším…' : 'Zrušit export'}
				</Button>
			{:else}
				<Button variant="secondary" onclick={() => (open = false)}>Zavřít</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
