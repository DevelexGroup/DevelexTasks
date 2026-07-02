<script lang="ts">
	import { tick } from 'svelte';
	import DefaultLayout from '$lib/components/layout/DefaultLayout.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch';
	import Icon from '@iconify/svelte';
	import StimulusStage from './components/StimulusStage.svelte';
	import ExportProgressDialog from './components/ExportProgressDialog.svelte';
	import {
		countAllStimuli,
		countTaskStimuli,
		exportableTasks,
		sanitizeFileName,
		type ExportableLevel,
		type ExportStimulus
	} from '$lib/utils/stimulusExport/registry';
	import {
		canvasToBlob,
		captureToCanvas,
		downloadBlob,
		settleStimulus,
		type ExportFormat
	} from '$lib/utils/stimulusExport/capture';
	import {
		StimulusExportPipeline,
		supportsDirectoryExport,
		type ExportJobItem,
		type ExportSettings,
		type RenderResult
	} from '$lib/utils/stimulusExport/exportPipeline.svelte';

	// #region Selection
	let selectedTaskSlug = $state(exportableTasks[0].slug);
	const selectedTask = $derived(
		exportableTasks.find((task) => task.slug === selectedTaskSlug) ?? exportableTasks[0]
	);

	let selectedLevelId = $state(exportableTasks[0].levels[0].levelId);
	const selectedLevel = $derived(
		selectedTask.levels.find((level) => level.levelId === selectedLevelId) ?? selectedTask.levels[0]
	);

	let stimulusSearch = $state('');
	const filteredStimuli = $derived(
		selectedLevel.stimuli.filter((stimulus) =>
			stimulus.id.toLowerCase().includes(stimulusSearch.trim().toLowerCase())
		)
	);

	let selectedStimulusId = $state<string | null>(null);
	const selectedStimulus = $derived(
		selectedLevel.stimuli.find((stimulus) => stimulus.id === selectedStimulusId) ??
			filteredStimuli[0] ??
			null
	);

	function selectTask(slug: typeof selectedTaskSlug) {
		selectedTaskSlug = slug;
		const task = exportableTasks.find((t) => t.slug === slug) ?? exportableTasks[0];
		selectedLevelId = task.levels[0].levelId;
		selectedStimulusId = null;
		stimulusSearch = '';
	}
	// #endregion

	// #region Settings
	const RESOLUTION_PRESETS = [
		{ label: '1920 × 1080', width: 1920, height: 1080 },
		{ label: '1536 × 864', width: 1536, height: 864 },
		{ label: '1366 × 768', width: 1366, height: 768 },
		{ label: '1280 × 720', width: 1280, height: 720 }
	];

	let width = $state(1920);
	let height = $state(1080);
	let scale = $state(1);
	let format = $state<ExportFormat>('png');
	let quality = $state(0.9);
	let answerOverlay = $state(false);
	let previewTargets = $state(false);

	const settings = $derived<ExportSettings>({
		width,
		height,
		scale,
		format,
		quality,
		answerOverlay
	});

	const resolutionValid = $derived(
		width >= 320 && width <= 7680 && height >= 240 && height <= 4320
	);
	// #endregion

	// #region Stage + export
	const directorySupported = supportsDirectoryExport();
	const pipeline = new StimulusExportPipeline();

	let stage = $state<StimulusStage | null>(null);
	let progressOpen = $state(false);
	let singleExporting = $state(false);
	let exportError = $state<string | null>(null);

	// While a bulk run is active the pipeline drives the stage; otherwise the selection does.
	let exportItem = $state<{
		level: ExportableLevel;
		stimulus: ExportStimulus;
		highlight: boolean;
	} | null>(null);

	const stageLevel = $derived(exportItem?.level ?? selectedLevel);
	const stageStimulus = $derived(exportItem?.stimulus ?? selectedStimulus);
	const stageHighlight = $derived(
		exportItem ? exportItem.highlight : previewTargets && selectedLevel.supportsAnswerOverlay
	);

	async function renderForExport(
		level: ExportableLevel,
		stimulus: ExportStimulus,
		highlight: boolean
	): Promise<RenderResult> {
		exportItem = { level, stimulus, highlight };
		await tick();
		const node = stage?.getCaptureNode();
		if (!node) throw new Error('Stimulus stage is not mounted');
		const { warnings } = await settleStimulus(node);
		return { node, warnings };
	}

	async function exportSelected() {
		if (!selectedStimulus || singleExporting) return;
		singleExporting = true;
		exportError = null;
		try {
			const { node } = await renderForExport(
				selectedLevel,
				selectedStimulus,
				answerOverlay && selectedLevel.supportsAnswerOverlay
			);
			const canvas = await captureToCanvas(node, scale);
			const blob = await canvasToBlob(canvas, format, quality);
			const name = `stimulus-export_${sanitizeFileName(selectedLevel.taskSlug)}-${sanitizeFileName(selectedLevel.levelId)}-${sanitizeFileName(selectedStimulus.id)}_${width}x${height}@${scale}x.${format}`;
			downloadBlob(blob, name);
		} catch (error) {
			exportError = error instanceof Error ? error.message : String(error);
		} finally {
			exportItem = null;
			singleExporting = false;
		}
	}

	function levelItems(level: ExportableLevel): ExportJobItem[] {
		return level.stimuli.map((stimulus) => ({ level, stimulus }));
	}

	async function runBulk(items: ExportJobItem[]) {
		if (pipeline.running || items.length === 0) return;
		exportError = null;
		try {
			progressOpen = true;
			await pipeline.run(items, settings, renderForExport);
		} catch (error) {
			progressOpen = false;
			// User cancelling the directory picker is not an error worth surfacing.
			if (!(error instanceof DOMException && error.name === 'AbortError')) {
				exportError = error instanceof Error ? error.message : String(error);
			}
		} finally {
			exportItem = null;
		}
	}

	const levelCount = $derived(selectedLevel.stimuli.length);
	const taskCount = $derived(countTaskStimuli(selectedTask));
	const allCount = countAllStimuli();

	const busy = $derived(pipeline.running || singleExporting);
	// #endregion
</script>

<svelte:head>
	<title>Export stimulů - DeveLex Tasks</title>
	<meta name="description" content="Export stimulů úloh jako obrázky" />
</svelte:head>

<DefaultLayout>
	<div class="flex items-center gap-3">
		<a href="/admin" class="text-sm font-semibold text-blue-600 hover:underline">← Administrace</a>
	</div>
	<h1 class="text-2xl font-black text-gray-800">Export stimulů</h1>

	{#if !directorySupported}
		<div class="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
			Hromadný export na disk vyžaduje prohlížeč založený na Chromiu (Chrome, Edge). V tomto
			prohlížeči je dostupný pouze export jednotlivých stimulů ke stažení.
		</div>
	{/if}

	{#if exportError}
		<div class="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
			Export selhal: {exportError}
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(300px,380px)_1fr]">
		<!-- Settings panel -->
		<div class="flex flex-col gap-5 rounded-xl bg-white p-5 shadow-xl shadow-gray-300/50">
			<!-- Task -->
			<div class="flex flex-col gap-2">
				<Label>Úloha</Label>
				<div class="flex flex-wrap gap-1.5">
					{#each exportableTasks as task (task.slug)}
						<button
							class="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors {task.slug ===
							selectedTaskSlug
								? 'bg-blue-600 text-white'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
							onclick={() => selectTask(task.slug)}
							disabled={busy}
						>
							{task.slug}
						</button>
					{/each}
				</div>
				<p class="text-xs text-gray-500">{selectedTask.label}</p>
			</div>

			<!-- Level -->
			<div class="flex flex-col gap-2">
				<Label for="level-select">Úroveň</Label>
				<select
					id="level-select"
					class="h-9 rounded-md border border-gray-200 bg-transparent px-3 text-sm"
					bind:value={selectedLevelId}
					onchange={() => {
						selectedStimulusId = null;
						stimulusSearch = '';
					}}
					disabled={busy}
				>
					{#each selectedTask.levels as level (level.levelId)}
						<option value={level.levelId}>
							{level.label} ({level.stimuli.length} stimulů)
						</option>
					{/each}
				</select>
			</div>

			<!-- Stimulus -->
			<div class="flex flex-col gap-2">
				<Label for="stimulus-search">Stimul ({filteredStimuli.length})</Label>
				<Input
					id="stimulus-search"
					placeholder="Hledat podle ID…"
					bind:value={stimulusSearch}
					disabled={busy}
				/>
				<div class="h-40 overflow-y-auto rounded-md border border-gray-200">
					{#each filteredStimuli.slice(0, 500) as stimulus (stimulus.id)}
						<button
							class="block w-full truncate px-3 py-1 text-left font-mono text-xs transition-colors {stimulus.id ===
							selectedStimulus?.id
								? 'bg-blue-600 text-white'
								: 'text-gray-700 hover:bg-gray-100'}"
							onclick={() => (selectedStimulusId = stimulus.id)}
							disabled={busy}
						>
							{stimulus.id}
						</button>
					{/each}
					{#if filteredStimuli.length > 500}
						<p class="px-3 py-1 text-xs text-gray-400">
							… a {filteredStimuli.length - 500} dalších (upřesněte hledání)
						</p>
					{/if}
					{#if filteredStimuli.length === 0}
						<p class="px-3 py-2 text-xs text-gray-400">Žádný stimul neodpovídá hledání</p>
					{/if}
				</div>
			</div>

			<!-- Resolution -->
			<div class="flex flex-col gap-2">
				<Label>Rozlišení okna</Label>
				<div class="flex flex-wrap gap-1.5">
					{#each RESOLUTION_PRESETS as preset (preset.label)}
						<button
							class="rounded-md px-2.5 py-1 text-xs font-semibold transition-colors {width ===
								preset.width && height === preset.height
								? 'bg-blue-600 text-white'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
							onclick={() => {
								width = preset.width;
								height = preset.height;
							}}
							disabled={busy}
						>
							{preset.label}
						</button>
					{/each}
				</div>
				<div class="flex items-center gap-2">
					<Input
						type="number"
						class="w-24"
						min={320}
						max={7680}
						bind:value={width}
						disabled={busy}
					/>
					<span class="text-sm text-gray-400">×</span>
					<Input
						type="number"
						class="w-24"
						min={240}
						max={4320}
						bind:value={height}
						disabled={busy}
					/>
				</div>
				{#if !resolutionValid}
					<p class="text-xs text-red-600">Rozlišení musí být mezi 320×240 a 7680×4320.</p>
				{/if}
				{#if selectedTaskSlug === 'dyslex' && width < 1300}
					<p class="text-xs text-amber-600">
						Dyslex používá pevné rozvržení — pod ~1300 px šířky se obsah ořízne (stejně jako na
						reálné obrazovce).
					</p>
				{/if}
			</div>

			<!-- Scale -->
			<div class="flex flex-col gap-2">
				<Label for="scale-range">Měřítko exportu: {scale.toFixed(2)}×</Label>
				<input
					id="scale-range"
					type="range"
					min="0.25"
					max="3"
					step="0.05"
					bind:value={scale}
					disabled={busy}
				/>
				<p class="text-xs text-gray-500">
					Výstup: {Math.round(width * scale)} × {Math.round(height * scale)} px
				</p>
			</div>

			<!-- Format -->
			<div class="flex flex-col gap-2">
				<Label>Formát</Label>
				<div class="flex gap-1.5">
					<button
						class="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors {format === 'png'
							? 'bg-blue-600 text-white'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
						onclick={() => (format = 'png')}
						disabled={busy}
					>
						PNG (bezztrátový)
					</button>
					<button
						class="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors {format === 'jpg'
							? 'bg-blue-600 text-white'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
						onclick={() => (format = 'jpg')}
						disabled={busy}
					>
						JPG (menší soubory)
					</button>
				</div>
				{#if format === 'jpg'}
					<Label for="quality-range" class="mt-1">Kvalita JPG: {Math.round(quality * 100)} %</Label>
					<input
						id="quality-range"
						type="range"
						min="0.5"
						max="1"
						step="0.01"
						bind:value={quality}
						disabled={busy}
					/>
				{/if}
			</div>

			<!-- Answer overlay -->
			<div class="flex flex-col gap-2">
				<div class="flex items-center gap-3">
					<Switch id="answer-overlay" bind:checked={answerOverlay} disabled={busy} />
					<Label for="answer-overlay">Exportovat i variantu se zvýrazněnými cíli</Label>
				</div>
				{#if !selectedLevel.supportsAnswerOverlay}
					<p class="text-xs text-gray-400">
						Vybraná úroveň nemá definované cíle — varianta se pro ni přeskočí.
					</p>
				{/if}
				<div class="flex items-center gap-3">
					<Switch
						id="preview-targets"
						bind:checked={previewTargets}
						disabled={busy || !selectedLevel.supportsAnswerOverlay}
					/>
					<Label for="preview-targets">Zvýraznit cíle v náhledu</Label>
				</div>
			</div>

			<!-- Export buttons -->
			<div class="flex flex-col gap-2 border-t border-gray-100 pt-4">
				<Button onclick={exportSelected} disabled={busy || !selectedStimulus || !resolutionValid}>
					<Icon icon="material-symbols:download" class="mr-1 h-4 w-4" />
					{singleExporting ? 'Exportuji…' : 'Stáhnout vybraný stimul'}
				</Button>
				<Button
					variant="secondary"
					onclick={() => runBulk(levelItems(selectedLevel))}
					disabled={busy || !directorySupported || !resolutionValid}
				>
					Exportovat úroveň ({levelCount})
				</Button>
				<Button
					variant="secondary"
					onclick={() => runBulk(selectedTask.levels.flatMap(levelItems))}
					disabled={busy || !directorySupported || !resolutionValid}
				>
					Exportovat úlohu ({taskCount})
				</Button>
				<Button
					variant="outline"
					onclick={() =>
						runBulk(exportableTasks.flatMap((task) => task.levels.flatMap(levelItems)))}
					disabled={busy || !directorySupported || !resolutionValid}
				>
					Exportovat vše ({allCount})
				</Button>
				{#if directorySupported}
					<p class="text-xs text-gray-500">
						Hromadný export zapisuje soubory průběžně do vybrané složky ({'{úloha}/{úroveň}/{id}'}.{format}).
					</p>
				{/if}
			</div>
		</div>

		<!-- Preview -->
		<div class="flex min-w-0 flex-col gap-3 rounded-xl bg-white p-5 shadow-xl shadow-gray-300/50">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-bold text-gray-800">Náhled</h2>
				{#if stageStimulus}
					<span class="truncate font-mono text-xs text-gray-500">
						{stageLevel.taskSlug}/{stageLevel.levelId}/{stageStimulus.id} · {width}×{height}
					</span>
				{/if}
			</div>
			<StimulusStage
				bind:this={stage}
				level={stageLevel}
				stimulus={stageStimulus}
				{width}
				{height}
				highlightTargets={stageHighlight}
			/>
		</div>
	</div>

	<ExportProgressDialog bind:open={progressOpen} {pipeline} />
</DefaultLayout>
