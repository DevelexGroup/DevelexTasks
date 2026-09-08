<script lang="ts">
	import { untrack } from 'svelte';
	import Icon from '@iconify/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import {
		getPostProcessors,
		previewPostProcessor,
		type PostProcessingPreviewRow,
		type PostProcessor,
		type RecalculationScope
	} from '$lib/api/test-sessions';
	import {
		draftFromDefaults,
		resolveParameters,
		type ParameterDraft
	} from '$lib/utils/postProcessing/parameters';
	import {
		POST_PROCESS_STATUS_LABELS,
		PostProcessRunner
	} from '$lib/utils/postProcessing/runner.svelte';
	import PostProcessorParameters from './PostProcessorParameters.svelte';

	interface Props {
		open: boolean;
		scope: RecalculationScope;
		/** Called when the dialog closes after a run that changed data. */
		onFinished?: () => void;
	}

	let { open = $bindable(), scope, onFinished }: Props = $props();

	let phase = $state<'loading' | 'select' | 'running' | 'done'>('loading');
	let loadError = $state('');
	let processors = $state<PostProcessor[]>([]);
	let selectedName = $state('');
	let rows = $state<PostProcessingPreviewRow[]>([]);
	let previewLoading = $state(false);
	let replaceExisting = $state(false);
	let draft = $state<ParameterDraft>({});
	let errors = $state<Record<string, string>>({});
	// Bumping the token discards a preview that finishes after the selection changed
	let previewToken = 0;

	const runner = new PostProcessRunner();

	const selected = $derived(
		processors.find((processor) => processor.name === selectedName) ?? null
	);
	const withInput = $derived(rows.filter((row) => row.hasInput).length);
	const withoutOutput = $derived(rows.filter((row) => row.hasInput && !row.hasOutput).length);
	const selectedSessionCount = $derived(
		rows.filter((row) => PostProcessRunner.sessionNeedsWork(row, replaceExisting)).length
	);

	const summary = $derived.by(() => {
		const outcomes = runner.outcomes;
		return {
			processed: outcomes.filter((o) => o.status === 'PROCESSED').length,
			skipped: outcomes.filter((o) => o.status !== 'PROCESSED' && o.status !== 'FAILED'),
			failed: outcomes.filter((o) => o.status === 'FAILED')
		};
	});

	$effect(() => {
		if (!open) return;
		// The reopen forced by the close-while-running guard must not reset the run
		untrack(() => {
			if (!runner.running && phase !== 'running') loadProcessors();
		});
	});

	// Closing mid-run only requests a stop so the result stays visible
	$effect(() => {
		if (!open && runner.running) {
			runner.stop();
			open = true;
		}
	});

	async function loadProcessors() {
		phase = 'loading';
		loadError = '';
		rows = [];
		replaceExisting = false;
		try {
			processors = await getPostProcessors();
			if (!processors.some((processor) => processor.name === selectedName)) {
				selectedName = processors[0]?.name ?? '';
			}
			selectProcessor(selectedName);
			phase = 'select';
		} catch (err) {
			loadError = err instanceof Error ? err.message : 'Nepodařilo se načíst post-procesory';
			phase = 'select';
		}
	}

	function selectProcessor(name: string) {
		selectedName = name;
		errors = {};
		const processor = processors.find((candidate) => candidate.name === name);
		draft = processor ? draftFromDefaults(processor.parameters) : {};
		void loadPreview(name);
	}

	async function loadPreview(name: string) {
		const token = ++previewToken;
		rows = [];
		loadError = '';
		if (!name) return;
		previewLoading = true;
		try {
			const loaded = await previewPostProcessor(name, scope);
			if (token === previewToken) rows = loaded;
		} catch (err) {
			if (token === previewToken) {
				loadError = err instanceof Error ? err.message : 'Nepodařilo se načíst přehled';
			}
		} finally {
			if (token === previewToken) previewLoading = false;
		}
	}

	async function start() {
		if (!selected || selectedSessionCount === 0) return;
		const resolved = resolveParameters(selected.parameters, draft);
		errors = resolved.errors;
		if (Object.keys(errors).length > 0) return;

		phase = 'running';
		try {
			await runner.run(rows, selected.name, resolved.values, replaceExisting);
		} finally {
			phase = 'done';
		}
	}

	function close() {
		if (runner.running) return;
		const changed = phase === 'done' && summary.processed > 0;
		open = false;
		if (changed) onFinished?.();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[560px]">
		<Dialog.Header>
			<Dialog.Title>Spustit post-processing</Dialog.Title>
			<Dialog.Description>Spustí vybraný skript nad soubory sezení v rozsahu.</Dialog.Description>
		</Dialog.Header>

		{#if phase === 'loading'}
			<div class="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
				<Icon icon="mdi:loading" class="h-5 w-5 animate-spin" />
				Načítám post-procesory…
			</div>
		{:else if phase === 'select'}
			{#if loadError}
				<div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
					{loadError}
					<button class="ml-2 font-semibold hover:underline" onclick={loadProcessors}>
						Zkusit znovu
					</button>
				</div>
			{:else if processors.length === 0}
				<p class="py-6 text-center text-sm text-gray-500">Žádný post-processing není povolen.</p>
			{:else}
				<div class="space-y-3 py-2">
					<label class="block space-y-1 text-sm">
						<span class="text-xs text-gray-500">Skript</span>
						<select
							class="w-full rounded-md border border-gray-300 px-2 py-1"
							value={selectedName}
							onchange={(e) => selectProcessor(e.currentTarget.value)}
						>
							{#each processors as processor (processor.name)}
								<option value={processor.name}>{processor.label}</option>
							{/each}
						</select>
					</label>

					{#if selected}
						<div class="rounded-lg border border-gray-200 p-3">
							<p class="text-sm font-medium text-gray-800">{selected.label}</p>
							<p class="mt-0.5 text-xs text-gray-400">{selected.description}</p>
							<p class="mt-1 text-xs text-gray-400">
								Vstup: {selected.inputFilePrefix}, výstup: {selected.outputFilePrefix}
							</p>
							{#if previewLoading}
								<p class="mt-2 flex items-center gap-1 text-sm text-gray-500">
									<Icon icon="mdi:loading" class="h-4 w-4 animate-spin" />
									Načítám přehled sezení…
								</p>
							{:else}
								<p class="mt-2 text-sm text-gray-500">
									V rozsahu je {rows.length} sezení, {withInput} se vstupními soubory, {withoutOutput}
									bez výstupu.
								</p>
							{/if}
							<label class="mt-2 flex items-center gap-2 text-xs text-gray-500">
								<input
									type="checkbox"
									class="h-3.5 w-3.5 accent-blue-600"
									bind:checked={replaceExisting}
									disabled={withInput === 0}
								/>
								Přepočítat i existující výstupy – původní soubory zůstanou jako záloha
							</label>
						</div>

						{#if selected.parameters.length > 0}
							<div class="rounded-lg border border-gray-200 p-3">
								<p class="mb-2 text-sm font-medium text-gray-800">Parametry</p>
								<PostProcessorParameters parameters={selected.parameters} bind:draft {errors} />
							</div>
						{/if}
					{/if}
				</div>

				<Dialog.Footer>
					<button
						type="button"
						class="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
						onclick={close}
					>
						Zrušit
					</button>
					<button
						type="button"
						class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
						disabled={!selected || previewLoading || selectedSessionCount === 0}
						onclick={start}
					>
						Spustit ({selectedSessionCount} sezení)
					</button>
				</Dialog.Footer>
			{/if}
		{:else if phase === 'running'}
			<div class="space-y-4 py-4">
				<div>
					<div class="mb-1 flex justify-between text-sm text-gray-600">
						<span>Zpracováno {runner.processed} z {runner.total} sezení</span>
						<span
							>{runner.total > 0 ? Math.round((runner.processed / runner.total) * 100) : 0} %</span
						>
					</div>
					<div class="h-2 overflow-hidden rounded-full bg-gray-200">
						<div
							class="h-full rounded-full bg-blue-600 transition-all"
							style="width: {runner.total > 0 ? (runner.processed / runner.total) * 100 : 0}%"
						></div>
					</div>
				</div>
				<p class="truncate text-sm text-gray-500" title={runner.currentLabel}>
					{runner.stopping ? 'Zastavuji po dokončení aktuálního sezení…' : runner.currentLabel}
				</p>
			</div>

			<Dialog.Footer>
				<button
					type="button"
					class="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
					disabled={runner.stopping}
					onclick={() => runner.stop()}
				>
					Zastavit
				</button>
			</Dialog.Footer>
		{:else}
			<div class="space-y-3 py-2">
				<div class="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-gray-200 p-4 text-sm">
					<span class="text-gray-500">Zpracovaná sezení</span>
					<span class="font-medium text-gray-800">{summary.processed}</span>
					<span class="text-gray-500">Přeskočená sezení</span>
					<span class="font-medium text-gray-800">{summary.skipped.length}</span>
					<span class="text-gray-500">Chyby</span>
					<span class="font-medium text-gray-800">{summary.failed.length}</span>
				</div>

				{#if runner.processed < runner.total}
					<p class="text-sm text-amber-600">
						Zpracování bylo zastaveno ({runner.processed} z {runner.total} sezení).
					</p>
				{/if}

				{#if summary.skipped.length > 0}
					<div class="max-h-32 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-3">
						{#each summary.skipped as outcome (outcome.sessionId)}
							<p class="text-xs text-gray-600">
								<span class="font-medium">{outcome.label}:</span>
								{POST_PROCESS_STATUS_LABELS[outcome.status]}
							</p>
						{/each}
					</div>
				{/if}

				{#if summary.failed.length > 0}
					<div class="max-h-40 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-3">
						<p class="mb-1 text-sm font-medium text-red-800">
							Chyby ({summary.failed.length} sezení):
						</p>
						{#each summary.failed as outcome (outcome.sessionId)}
							<p class="text-xs text-red-700">
								<span class="font-medium">{outcome.label}:</span>
								{outcome.message ?? 'neznámá chyba'}
							</p>
						{/each}
					</div>
				{/if}
			</div>

			<Dialog.Footer>
				<button
					type="button"
					class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					onclick={close}
				>
					Zavřít
				</button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
