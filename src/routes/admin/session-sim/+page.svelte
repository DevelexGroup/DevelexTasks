<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import DefaultLayout from '$lib/components/layout/DefaultLayout.svelte';
	import BackButton from '$lib/components/layout/BackButton.svelte';
	import OffscreenStimulusStage from '$lib/components/OffscreenStimulusStage.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import Icon from '@iconify/svelte';
	import StimulusStage from '$lib/components/StimulusStage.svelte';
	import SessionLoadDialog from '$lib/components/SessionLoadDialog.svelte';
	import GazeOverlay, {
		type GazePoint,
		type OverlayFixation,
		type OverlayLayer
	} from './components/GazeOverlay.svelte';
	import ScoreComparison from './components/ScoreComparison.svelte';
	import PostProcessorParameters from '$lib/components/PostProcessorParameters.svelte';
	import { downloadBlob } from '$lib/utils/stimulusExport/capture';
	import { DatabaseExporter } from '$lib/utils/databaseExport';
	import {
		runPostProcessorHeadless,
		snapToCommonRate,
		type PostProcessor
	} from '$lib/api/test-sessions';
	import type { RawGazeDataEntry } from '$lib/database/db.types';
	import { parseOutputCsv, readOutputRows } from '$lib/utils/postProcessing/outputs';
	import {
		applyPrefill,
		draftFromDefaults,
		resolveParameters,
		type ParameterDraft,
		type PrefillValues
	} from '$lib/utils/postProcessing/parameters';
	import {
		layerColor,
		layerColorName,
		loadPostProcessors
	} from '$lib/utils/postProcessing/registry';
	import {
		buildCorrectedZip,
		correctedZipName,
		type ExportedSession
	} from '$lib/utils/sessionSim/export';
	import {
		SessionWorkspace,
		type ProcessorLayer,
		type SessionSimState
	} from '$lib/utils/sessionSim/simState.svelte';
	import { IDENTITY_MATRIX } from '$lib/utils/sessionSim/transform';
	import {
		DEFAULT_GAP_RESET_MS,
		type CorrectionMatrix,
		type RebaseMode,
		type SessionSource
	} from '$lib/utils/sessionSim/types';

	const workspace = new SessionWorkspace();
	const settings = workspace.settings;
	const sim = $derived(workspace.active);

	let loadDialogOpen = $state(true);
	let captureStage = $state<OffscreenStimulusStage | null>(null);

	function errorMessage(err: unknown): string {
		return err instanceof Error ? err.message : String(err);
	}

	// ── Sessions ──
	const slotPosition = $derived(
		workspace.slots.findIndex((slot) => slot.key === workspace.activeKey)
	);

	function handleSourcesPicked(sources: SessionSource[]) {
		workspace.setSources(sources);
		if (workspace.activeKey) void activate(workspace.activeKey);
	}

	/** Makes a session current, downloading it on first use. */
	async function activate(key: string) {
		workspace.activeKey = key;
		const slot = workspace.active;
		if (!slot) return;
		try {
			await slot.ensureLoaded();
		} catch {
			return;
		}
		if (workspace.active !== slot) return;
		syncInputsFrom(slot);
		if (slot.isStale) slot.recomputeNow();
		void ensureGeometry(slot);
	}

	// ── Viewport ──
	const RESOLUTION_PRESETS = [
		{ label: '2560 × 1440', width: 2560, height: 1440 },
		{ label: '1920 × 1080', width: 1920, height: 1080 },
		{ label: '1536 × 864', width: 1536, height: 864 },
		{ label: '1366 × 768', width: 1366, height: 768 },
		{ label: '1280 × 720', width: 1280, height: 720 }
	];
	let viewportW = $state(1920);
	let viewportH = $state(1080);

	// Recorded geometry and meta.json carry the real recording viewport and rate
	function syncInputsFrom(slot: SessionSimState) {
		viewportW = slot.viewportWidth;
		viewportH = slot.viewportHeight;
		prefillDrafts(slot);
	}

	function applyViewport(width = viewportW, height = viewportH) {
		if (!sim) return;
		viewportW = width;
		viewportH = height;
		sim.setViewport(width, height);
		prefillDrafts(sim);
		void ensureGeometry(sim);
	}

	// ── Geometry capture ──
	let captureProgress = $state<string | null>(null);
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const captureRuns = new Map<string, Promise<void>>();

	const missingGeometry = $derived(
		sim ? sim.slides.filter((slide) => sim.resolvedBySlide[slide] && !sim.hasGeometry(slide)) : []
	);
	const allSlidesRecorded = $derived(
		!!sim && sim.slides.length > 0 && sim.slides.every((slide) => sim.recordedAois[slide])
	);

	/** Captures AOI geometry offscreen for every renderable slide that lacks it; one run per session at a time. */
	function ensureGeometry(slot: SessionSimState): Promise<void> {
		const running = captureRuns.get(slot.key);
		if (running) return running;
		const run = captureGeometry(slot).finally(() => captureRuns.delete(slot.key));
		captureRuns.set(slot.key, run);
		return run;
	}

	async function captureGeometry(slot: SessionSimState) {
		if (!slot.session || !captureStage) return;
		try {
			for (const slide of slot.slides) {
				const resolved = slot.resolvedBySlide[slide];
				if (!resolved || slot.hasGeometry(slide)) continue;
				if (slot === workspace.active) captureProgress = `Načítám geometrii slidu ${slide}…`;
				const viewport = { width: slot.viewportWidth, height: slot.viewportHeight };
				const rects = await captureStage.capture(resolved, viewport);
				slot.registerGeometry(slide, rects);
			}
		} finally {
			if (slot === workspace.active) captureProgress = null;
		}
	}

	// ── Derived per-slide view data ──
	const selectedResolved = $derived(
		sim && sim.selectedSlide !== null ? (sim.resolvedBySlide[sim.selectedSlide] ?? null) : null
	);
	const selectedWindow = $derived(
		sim && sim.selectedSlide !== null
			? (sim.result?.perSlide.get(sim.selectedSlide)?.window ?? null)
			: null
	);
	const stageAois = $derived(sim?.geometryFor(sim.selectedSlide)?.aois ?? []);
	const stageWidth = $derived(sim?.viewportWidth ?? 1920);
	const stageHeight = $derived(sim?.viewportHeight ?? 1080);

	// The preview shows everything recorded on the slide; the score only counts
	// what falls inside the effective window, so the rest is drawn dimmed.
	function slideGaze(rows: RawGazeDataEntry[]): GazePoint[] {
		return rows
			.filter((r) => r.slide_index === sim?.selectedSlide && (r.validityL || r.validityR))
			.map((r) => ({ x: r.x, y: r.y }));
	}
	const gazeBefore = $derived(sim?.session ? slideGaze(sim.session.rawGazeData) : []);
	const gazeAfter = $derived(sim?.result ? slideGaze(sim.result.rawGazeData) : []);
	const fixationsBefore = $derived.by((): OverlayFixation[] => {
		if (!sim?.session) return [];
		return sim.session.fixationData
			.filter((f) => f.slide_index === sim.selectedSlide)
			.map((f) => ({
				...f,
				counted:
					selectedWindow !== null &&
					f.timestamp >= selectedWindow.startTime &&
					f.timestamp <= selectedWindow.endTime
			}));
	});
	const fixationsAfter = $derived.by((): OverlayFixation[] => {
		const slideResult =
			sim && sim.selectedSlide !== null ? sim.result?.perSlide.get(sim.selectedSlide) : undefined;
		if (!slideResult) return [];
		const counted = new Set(slideResult.fixations.map((f) => f.fixation_index));
		return slideResult.allFixations.map((f) => ({ ...f, counted: counted.has(f.fixation_index) }));
	});
	const simLayers = $derived(sim?.layers ?? []);
	const overlayLayers = $derived.by((): OverlayLayer[] => {
		const slot = sim;
		const slide = slot?.selectedSlide ?? null;
		if (!slot || slide === null) return [];
		const layers: OverlayLayer[] = [];
		for (const layer of simLayers) {
			const schema = layer.processor.output;
			if (!schema || hiddenLayers[layer.processor.name]) continue;
			const markers = slot
				.shiftedFiles(layer, slide)
				.flatMap((file) => readOutputRows(file, schema))
				.sort((a, b) => a.time - b.time)
				.flatMap((row) => {
					const point = row.points[0];
					if (row.slide !== slide || !point) return [];
					const counted =
						selectedWindow !== null &&
						row.time >= selectedWindow.startTime &&
						row.time <= selectedWindow.endTime;
					return [{ x: point.x, y: point.y, duration: row.duration, counted }];
				});
			layers.push({ key: layer.processor.name, color: colorOf(layer.processor), markers });
		}
		return layers;
	});
	const recordedScore = $derived(
		sim?.session?.sessionScores.find((s) => s.slide_index === sim.selectedSlide) ?? null
	);
	const recomputedScore = $derived(
		sim?.result?.sessionScores.find((s) => s.slide_index === sim.selectedSlide) ?? null
	);
	const outsideShare = $derived.by(() => {
		if (gazeAfter.length === 0) return 0;
		const outside = gazeAfter.filter(
			(p) => p.x < 0 || p.y < 0 || p.x > stageWidth || p.y > stageHeight
		).length;
		return outside / gazeAfter.length;
	});

	function pct(value: number): string {
		return `${Math.round(value * 100)} %`;
	}

	// ── Overlay toggles ──
	let showGaze = $state(true);
	let showBefore = $state(true);
	let showAfter = $state(true);
	let showAois = $state(true);

	// ── Input helpers ──
	function numberOf(event: Event, fallback = 0): number {
		const value = parseFloat((event.currentTarget as HTMLInputElement).value);
		return Number.isFinite(value) ? value : fallback;
	}

	function updateDetector(patch: Partial<typeof settings.detectorParams>) {
		settings.detectorParams = { ...settings.detectorParams, ...patch };
		workspace.settingsChanged();
	}

	function formatSessionDate(sessionId: string): string {
		const ms = parseFloat(sessionId);
		return Number.isFinite(ms) ? DatabaseExporter.formatTimestamp(ms, 'simple') : sessionId;
	}

	// ── Post-processing ──
	let processors = $state<PostProcessor[]>([]);
	let selectedProcessorName = $state<string | null>(null);
	let drafts = $state<Record<string, ParameterDraft>>({});
	let parameterErrors = $state<Record<string, string>>({});
	let hiddenLayers = $state<Record<string, boolean>>({});
	let processing = $state(false);
	let processingProgress = $state('');
	let processingStatus = $state('');
	let processingErrors = $state<string[]>([]);

	const selectedProcessor = $derived(
		processors.find((processor) => processor.name === selectedProcessorName) ?? null
	);
	const selectedLayer = $derived(
		simLayers.find((layer) => layer.processor.name === selectedProcessorName) ?? null
	);

	void loadPostProcessors().then((loaded) => {
		processors = loaded;
		selectedProcessorName = loaded[0]?.name ?? null;
		drafts = Object.fromEntries(
			loaded.map((processor) => [processor.name, draftFromDefaults(processor.parameters)])
		);
		if (sim?.session) prefillDrafts(sim);
	});

	function colorOf(processor: PostProcessor) {
		const index = processors.findIndex((candidate) => candidate.name === processor.name);
		return layerColor(index < 0 ? processors.length : index);
	}

	function colorNameOf(processor: PostProcessor): string {
		const index = processors.findIndex((candidate) => candidate.name === processor.name);
		return layerColorName(index < 0 ? processors.length : index);
	}

	function prefillValues(slot: SessionSimState): PrefillValues {
		const measured = slot.session?.meta?.measuredFrequencyHz;
		return {
			VIEWPORT_WIDTH: slot.viewportWidth,
			VIEWPORT_HEIGHT: slot.viewportHeight,
			SAMPLING_RATE: measured ? snapToCommonRate(measured) : undefined
		};
	}

	function prefillDrafts(slot: SessionSimState) {
		const values = prefillValues(slot);
		drafts = Object.fromEntries(
			processors.map((processor) => [
				processor.name,
				applyPrefill(processor.parameters, drafts[processor.name] ?? {}, values)
			])
		);
	}

	/** Recomputes the processor on the slot's corrected raw gaze; the result replaces the stored output. */
	async function rerun(
		slot: SessionSimState,
		processor: PostProcessor,
		parameters: Record<string, unknown>
	) {
		const corrections = slot.correctionSnapshot();
		const inputs = slot.rerunInputs(processor, corrections);
		if (!inputs) throw new Error('Chybí surová data pohledu');
		const outputs = await runPostProcessorHeadless(processor.name, inputs, parameters);
		const files = outputs.map((output) => parseOutputCsv(output.fileName, output.content));
		slot.setRerun({ processor, files, corrections, parameters });
		return files.length;
	}

	function resolveDraft(
		processor: PostProcessor,
		draft: ParameterDraft
	): Record<string, unknown> | null {
		const { values, errors } = resolveParameters(processor.parameters, draft);
		parameterErrors = errors;
		return Object.keys(errors).length > 0 ? null : values;
	}

	async function rerunActive() {
		const slot = sim;
		const processor = selectedProcessor;
		if (!slot || !processor || processing) return;
		const parameters = resolveDraft(processor, drafts[processor.name] ?? {});
		if (!parameters) return;
		processing = true;
		processingStatus = '';
		processingErrors = [];
		try {
			const count = await rerun(slot, processor, parameters);
			processingStatus = `Přepočteno na opravených datech (${count} souborů).`;
		} catch (err) {
			processingErrors = [errorMessage(err)];
		} finally {
			processing = false;
		}
	}

	/** Runs every picked session in turn; prefilled parameters come from each session itself. */
	async function rerunAll() {
		const processor = selectedProcessor;
		if (!processor || processing) return;
		const draft = drafts[processor.name] ?? {};
		if (!resolveDraft(processor, draft)) return;
		processing = true;
		processingStatus = '';
		processingErrors = [];
		let done = 0;
		try {
			const slots = workspace.slots;
			for (const [index, slot] of slots.entries()) {
				const prefix = `${index + 1}/${slots.length} ${slot.label}`;
				try {
					processingProgress = `${prefix}: stahuji…`;
					await slot.ensureLoaded();
					processingProgress = `${prefix}: geometrie…`;
					await ensureGeometry(slot);
					processingProgress = `${prefix}: počítám…`;
					const sessionDraft = applyPrefill(processor.parameters, draft, prefillValues(slot));
					const { values } = resolveParameters(processor.parameters, sessionDraft);
					await rerun(slot, processor, values);
					done++;
				} catch (err) {
					processingErrors = [...processingErrors, `${slot.label}: ${errorMessage(err)}`];
				}
			}
			processingStatus = `Přepočteno ${done} z ${slots.length} sezení.`;
		} finally {
			processing = false;
			processingProgress = '';
		}
	}

	// ── Matrix correction ──
	const activeMatrix = $derived(sim?.activeCorrection.matrix ?? IDENTITY_MATRIX);

	function updateMatrixCell(index: number, value: number) {
		const next = [...activeMatrix] as CorrectionMatrix;
		next[index] = value;
		sim?.updateCorrection({ matrix: next });
	}

	// ── Export ──
	let exporting = $state(false);
	let exportProgress = $state('');
	let exportErrors = $state<string[]>([]);

	/** Downloads, replays and packs every picked session; sessions never opened get the shared rules with no correction. */
	async function exportCorrected() {
		if (exporting || workspace.slots.length === 0) return;
		exporting = true;
		exportErrors = [];
		const entries: ExportedSession[] = [];
		try {
			const slots = workspace.slots;
			for (const [index, slot] of slots.entries()) {
				const prefix = `${index + 1}/${slots.length} ${slot.label}`;
				try {
					exportProgress = `${prefix}: stahuji…`;
					await slot.ensureLoaded();
					exportProgress = `${prefix}: geometrie…`;
					await ensureGeometry(slot);
					exportProgress = `${prefix}: přepočet…`;
					slot.recomputeNow();
					if (!slot.result) throw new Error(slot.error || 'Bez rawGazeData nelze přepočítat');
					entries.push({
						result: slot.result,
						meta: slot.exportMeta(),
						outputs: slot.exportOutputs()
					});
				} catch (err) {
					exportErrors = [...exportErrors, `${slot.label}: ${errorMessage(err)}`];
				}
			}
			if (entries.length > 0) {
				exportProgress = 'Vytvářím ZIP…';
				const blob = await buildCorrectedZip(entries);
				downloadBlob(blob, correctedZipName(entries.map((entry) => entry.meta.session)));
			}
		} finally {
			exporting = false;
			exportProgress = '';
		}
	}

	const slidePosition = $derived(
		sim && sim.selectedSlide !== null ? sim.slides.indexOf(sim.selectedSlide) : -1
	);

	const inputClass =
		'w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800';
	const matrixInputClass =
		'w-full rounded-md border border-gray-300 bg-white px-1 py-1 text-center text-xs text-gray-800';
</script>

<svelte:head>
	<title>Simulace sezení - DeveLex Tasks</title>
</svelte:head>

{#snippet layerStatus(processor: PostProcessor, layer: ProcessorLayer | null)}
	{#if !layer}
		<p class="text-xs text-gray-500">Sezení nemá uložený výstup.</p>
	{:else}
		<div class="flex items-center justify-between gap-2 text-xs">
			{#if layer.source === 'rerun'}
				<span class="rounded bg-emerald-100 px-1 py-0.5 text-emerald-700">
					přesný výpočet na opravených datech
				</span>
				<Button size="sm" variant="ghost" onclick={() => sim?.revertRerun(processor.name)}>
					Obnovit uložené
				</Button>
			{:else}
				<span class="rounded bg-gray-100 px-1 py-0.5 text-gray-600">uložený výstup ze serveru</span>
			{/if}
		</div>
		{#if sim?.isShifted(layer)}
			{#if processor.output}
				<div
					class="rounded-md bg-blue-50 px-2 py-1.5 text-xs text-blue-700"
					title={processor.output.spatialMetrics.length > 0
						? `Nekorigováno: ${processor.output.spatialMetrics.join(', ')}`
						: undefined}
				>
					Pozice posunuty podle aktuální korekce.
				</div>
			{:else}
				<div class="rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
					Výstup nelze posunout, neodpovídá aktuální korekci.
				</div>
			{/if}
		{/if}
	{/if}
{/snippet}

{#snippet overlay()}
	<GazeOverlay
		width={stageWidth}
		height={stageHeight}
		{gazeBefore}
		{gazeAfter}
		{fixationsBefore}
		{fixationsAfter}
		layers={overlayLayers}
		aois={stageAois}
		timeWindow={selectedWindow}
		{showGaze}
		{showBefore}
		{showAfter}
		{showAois}
	/>
{/snippet}

<DefaultLayout>
	<BackButton label="Zpět do hlavní nabídky" onclick={() => goto(resolve(`/`))} />

	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-black text-gray-800">Simulace sezení</h1>
		{#if sim?.recomputeMs !== null && sim?.recomputeMs !== undefined}
			<span class="text-xs text-gray-400">přepočet {sim.recomputeMs.toFixed(0)} ms</span>
		{/if}
	</div>

	<div class="flex items-start gap-6">
		<aside class="w-80 shrink-0 space-y-4">
			<Card.Root class="gap-3">
				<Card.Header>
					<Card.Title>Sezení</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3">
					{#if workspace.slots.length > 0}
						<div class="flex items-center gap-2">
							<Button
								size="sm"
								variant="outline"
								disabled={slotPosition <= 0}
								onclick={() => activate(workspace.slots[slotPosition - 1].key)}
							>
								<Icon icon="material-symbols:chevron-left" class="h-4 w-4" />
							</Button>
							<select
								class={inputClass}
								value={workspace.activeKey}
								onchange={(e) => activate(e.currentTarget.value)}
							>
								{#each workspace.slots as slot (slot.key)}
									<option value={slot.key}>
										{slot.label}{slot.status === 'ready' ? '' : ' (nenačteno)'}
									</option>
								{/each}
							</select>
							<Button
								size="sm"
								variant="outline"
								disabled={slotPosition < 0 || slotPosition >= workspace.slots.length - 1}
								onclick={() => activate(workspace.slots[slotPosition + 1].key)}
							>
								<Icon icon="material-symbols:chevron-right" class="h-4 w-4" />
							</Button>
						</div>
						{#if workspace.slots.length > 1}
							<div class="text-xs text-gray-400">
								{workspace.loadedCount} z {workspace.slots.length} sezení staženo
							</div>
						{/if}
					{/if}
					{#if sim?.status === 'loading'}
						<div class="text-xs text-blue-600">Stahuji data sezení…</div>
					{:else if sim?.status === 'error'}
						<div class="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600">{sim.loadError}</div>
						<Button size="sm" variant="outline" class="w-full" onclick={() => activate(sim.key)}>
							Zkusit znovu
						</Button>
					{:else if sim?.session}
						<div class="text-sm text-gray-700">
							<div><span class="text-gray-400">Dítě:</span> {sim.session.childId}</div>
							<div><span class="text-gray-400">Úloha:</span> {sim.session.taskName}</div>
							<div>
								<span class="text-gray-400">Datum:</span>
								{formatSessionDate(sim.session.sessionId)}
							</div>
							<div>
								<span class="text-gray-400">Raw vzorků:</span>
								{sim.session.rawGazeData.length}
							</div>
						</div>
					{:else}
						<p class="text-sm text-gray-500">Žádné sezení nenačteno.</p>
					{/if}
					<Button class="w-full" onclick={() => (loadDialogOpen = true)}>
						<Icon icon="material-symbols:folder-open" class="mr-1 h-4 w-4" />
						Načíst sezení
					</Button>
					{#if sim?.error}
						<div class="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600">{sim.error}</div>
					{/if}
					{#each sim?.warnings ?? [] as warning (warning)}
						<div class="rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-700">{warning}</div>
					{/each}
				</Card.Content>
			</Card.Root>

			{#if sim?.session}
				<Card.Root class="gap-3">
					<Card.Header>
						<Card.Title>Viewport nahrávky</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						{#if sim.viewportSource !== 'manual'}
							<div class="rounded-md bg-emerald-50 px-2 py-1.5 text-xs text-emerald-700">
								Rozlišení {sim.viewportSource === 'geometry'
									? 'ze zaznamenané AOI geometrie'
									: 'z meta.json'} – ruční změna je obvykle zbytečná.
							</div>
						{/if}
						<select
							class={inputClass}
							onchange={(e) => {
								const preset = RESOLUTION_PRESETS[parseInt(e.currentTarget.value)];
								if (preset) applyViewport(preset.width, preset.height);
								e.currentTarget.value = '';
							}}
						>
							<option value="">Vybrat preset…</option>
							{#each RESOLUTION_PRESETS as preset, i (preset.label)}
								<option value={i}>{preset.label}</option>
							{/each}
						</select>
						<div class="flex items-center gap-2">
							<input
								type="number"
								class={inputClass}
								value={viewportW}
								oninput={(e) => (viewportW = numberOf(e, viewportW))}
							/>
							<span class="text-gray-400">×</span>
							<input
								type="number"
								class={inputClass}
								value={viewportH}
								oninput={(e) => (viewportH = numberOf(e, viewportH))}
							/>
							<Button size="sm" variant="outline" onclick={() => applyViewport()}>OK</Button>
						</div>
						{#if outsideShare > 0.02}
							<div class="rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
								{pct(outsideShare)} pohledu mimo viewport.
							</div>
						{/if}
					</Card.Content>
				</Card.Root>

				<Card.Root class="gap-3">
					<Card.Header>
						<Card.Title>Slide</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						<div class="flex items-center gap-2">
							<Button
								size="sm"
								variant="outline"
								disabled={slidePosition <= 0}
								onclick={() => (sim.selectedSlide = sim.slides[slidePosition - 1])}
							>
								<Icon icon="material-symbols:chevron-left" class="h-4 w-4" />
							</Button>
							<select
								class={inputClass}
								value={sim.selectedSlide}
								onchange={(e) => (sim.selectedSlide = Number(e.currentTarget.value))}
							>
								{#each sim.slides as slide (slide)}
									<option value={slide}>Slide {slide}</option>
								{/each}
							</select>
							<Button
								size="sm"
								variant="outline"
								disabled={slidePosition < 0 || slidePosition >= sim.slides.length - 1}
								onclick={() => (sim.selectedSlide = sim.slides[slidePosition + 1])}
							>
								<Icon icon="material-symbols:chevron-right" class="h-4 w-4" />
							</Button>
						</div>
						<div class="text-xs text-gray-500">
							Stimul:
							<span class="font-mono">
								{sim.selectedSlide !== null ? sim.stimulusBySlide[sim.selectedSlide] : '–'}
							</span>
							{#if sim.selectedSlide !== null && !sim.resolvedBySlide[sim.selectedSlide]}
								<span class="ml-1 rounded bg-amber-100 px-1 py-0.5 font-semibold text-amber-700">
									nelze vykreslit
								</span>
							{/if}
							{#if sim.selectedSlide !== null && sim.recordedAois[sim.selectedSlide]}
								<span class="ml-1 rounded bg-emerald-100 px-1 py-0.5 text-emerald-700">
									geometrie z nahrávky
								</span>
							{:else if sim.selectedSlide !== null && !sim.hasGeometry(sim.selectedSlide)}
								<span class="ml-1 rounded bg-gray-100 px-1 py-0.5 text-gray-500">
									geometrie nenačtena
								</span>
							{/if}
						</div>
						{#if captureProgress}
							<div class="text-xs text-blue-600">{captureProgress}</div>
						{:else if missingGeometry.length > 0}
							<Button
								size="sm"
								variant="outline"
								class="w-full"
								onclick={() => ensureGeometry(sim)}
							>
								Načíst chybějící geometrii ({missingGeometry.length})
							</Button>
						{/if}
					</Card.Content>
				</Card.Root>

				<Card.Root class="gap-3">
					<Card.Header>
						<Card.Title>Prostorová korekce</Card.Title>
						{#if workspace.slots.length > 1}
							<Card.Description>Platí jen pro toto sezení.</Card.Description>
						{/if}
					</Card.Header>
					<Card.Content class="space-y-3">
						<label class="flex items-center justify-between text-sm text-gray-700">
							Jen tento slide
							<Switch bind:checked={sim.editSlideOnly} disabled={sim.selectedSlide === null} />
						</label>
						<label
							class="flex items-center justify-between text-sm text-gray-700"
							title="Homogenní matice 4×4 pro bod (x, y, 0, 1); nahrazuje posun i měřítko"
						>
							Maticová korekce
							<Switch
								checked={sim.activeCorrection.useMatrix ?? false}
								onCheckedChange={(checked) => sim.updateCorrection({ useMatrix: checked })}
							/>
						</label>
						{#if sim.activeCorrection.useMatrix}
							<div class="grid grid-cols-4 gap-1">
								{#each activeMatrix as cell, i (i)}
									<input
										type="number"
										step="0.001"
										class={matrixInputClass}
										value={cell}
										oninput={(e) => updateMatrixCell(i, numberOf(e, IDENTITY_MATRIX[i]))}
									/>
								{/each}
							</div>
						{:else}
							<div class="grid grid-cols-2 gap-2 text-sm">
								<label class="space-y-1">
									<span class="text-xs text-gray-500">Posun X (px)</span>
									<input
										type="number"
										class={inputClass}
										value={Math.round(sim.activeCorrection.offsetX * 10) / 10}
										oninput={(e) => sim.updateCorrection({ offsetX: numberOf(e) })}
									/>
								</label>
								<label class="space-y-1">
									<span class="text-xs text-gray-500">Posun Y (px)</span>
									<input
										type="number"
										class={inputClass}
										value={Math.round(sim.activeCorrection.offsetY * 10) / 10}
										oninput={(e) => sim.updateCorrection({ offsetY: numberOf(e) })}
									/>
								</label>
								<label class="space-y-1">
									<span class="text-xs text-gray-500">Měřítko X</span>
									<input
										type="number"
										step="0.01"
										class={inputClass}
										value={sim.activeCorrection.scaleX}
										oninput={(e) => sim.updateCorrection({ scaleX: numberOf(e, 1) || 1 })}
									/>
								</label>
								<label class="space-y-1">
									<span class="text-xs text-gray-500">Měřítko Y</span>
									<input
										type="number"
										step="0.01"
										class={inputClass}
										value={sim.activeCorrection.scaleY}
										oninput={(e) => sim.updateCorrection({ scaleY: numberOf(e, 1) || 1 })}
									/>
								</label>
							</div>
						{/if}
						<Button
							size="sm"
							variant="outline"
							class="w-full"
							onclick={() => sim.resetCorrection()}
						>
							Vynulovat korekci
						</Button>
						{#if workspace.slots.length > 1}
							<Button
								size="sm"
								variant="outline"
								class="w-full"
								title="Zkopíruje korekci sezení (bez úprav slidů) do všech ostatních sezení"
								onclick={() => workspace.applyCorrectionToAll()}
							>
								Použít na všechna sezení
							</Button>
						{/if}
					</Card.Content>
				</Card.Root>

				<Card.Root class="gap-3">
					<Card.Header>
						<Card.Title>Detekce fixací</Card.Title>
						{#if workspace.slots.length > 1}
							<Card.Description>Společné pro všechna sezení.</Card.Description>
						{/if}
					</Card.Header>
					<Card.Content class="space-y-3">
						<div class="grid grid-cols-2 gap-2 text-sm">
							<label
								class="space-y-1"
								title="Zároveň práh ukončení: fixace končí, až když okno v toleranci klesne pod tuto délku. Nízké hodnoty fixace slučují."
							>
								<span class="text-xs text-gray-500">Min. délka (ms)</span>
								<input
									type="number"
									class={inputClass}
									value={settings.detectorParams.minimumFixationDurationMs}
									oninput={(e) => updateDetector({ minimumFixationDurationMs: numberOf(e, 100) })}
								/>
							</label>
							<label class="space-y-1">
								<span class="text-xs text-gray-500">Max. disperze (°)</span>
								<input
									type="number"
									step="0.05"
									class={inputClass}
									value={settings.detectorParams.maximumFixationDispersionDeg}
									oninput={(e) =>
										updateDetector({ maximumFixationDispersionDeg: numberOf(e, 1.35) })}
								/>
							</label>
							<label class="space-y-1">
								<span class="text-xs text-gray-500">Vzdálenost (cm)</span>
								<input
									type="number"
									class={inputClass}
									value={settings.detectorParams.distanceFromScreenCm}
									oninput={(e) => updateDetector({ distanceFromScreenCm: numberOf(e, 70) })}
								/>
							</label>
							<label class="space-y-1">
								<span class="text-xs text-gray-500">DPI</span>
								<input
									type="number"
									class={inputClass}
									value={settings.detectorParams.dpi}
									oninput={(e) => updateDetector({ dpi: numberOf(e, 96) })}
								/>
							</label>
						</div>
						<label class="block space-y-1 text-sm">
							<span class="text-xs text-gray-500">Přiřazení AOI k fixaci</span>
							<select
								class={inputClass}
								value={settings.aoiAttribution}
								onchange={(e) => {
									settings.aoiAttribution = e.currentTarget.value as typeof settings.aoiAttribution;
									workspace.settingsChanged();
								}}
							>
								<option value="snapshot-at-start">Při začátku fixace (živě)</option>
								<option value="centroid">Podle těžiště</option>
							</select>
						</label>
						{#if !allSlidesRecorded}
							<label
								class="flex items-center justify-between text-sm text-gray-700"
								title="Syntetické AOI slide-N_end pro šipku dalšího slidu; slidy se zaznamenanou geometrií mají skutečné"
							>
								Doplnit AOI šipky
								<Switch
									bind:checked={settings.synthesizeDwellArrow}
									onCheckedChange={() => workspace.settingsChanged()}
								/>
							</label>
							<label
								class="flex items-center justify-between text-sm text-gray-700"
								title="Syntetické AOI slide-N_initial pro úvodní oko; slidy se zaznamenanou geometrií mají skutečné"
							>
								Doplnit AOI oka
								<Switch
									bind:checked={settings.synthesizeDwellEye}
									onCheckedChange={() => workspace.settingsChanged()}
								/>
							</label>
						{/if}
					</Card.Content>
				</Card.Root>

				<Card.Root class="gap-3">
					<Card.Header>
						<Card.Title>Pravidla přepočtu</Card.Title>
						<Card.Description>Výchozí stav odpovídá živému záznamu.</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-3">
						<label
							class="flex items-center justify-between gap-3 text-sm text-gray-700"
							title="Fixace běžící na konci záznamu se živě nikdy neuloží"
						>
							Zahodit nedokončenou fixaci
							<Switch
								bind:checked={settings.dropUnfinishedFinalFixation}
								onCheckedChange={() => workspace.settingsChanged()}
							/>
						</label>
						<label
							class="flex items-center justify-between gap-3 text-sm text-gray-700"
							title="Fixace běžící při dokončení slidu se živě nezapočítá nikam"
						>
							Počítat fixace přes konec slidu
							<Switch
								bind:checked={settings.countFixationsOpenAtWindowEnd}
								onCheckedChange={() => workspace.settingsChanged()}
							/>
						</label>
						<label
							class="block space-y-1 text-sm"
							title="Bez resetu chybějící vzorky splynou v jednu dlouhou fixaci; 0 = vypnuto"
						>
							<span class="text-xs text-gray-500">Reset detektoru při mezeře (ms)</span>
							<input
								type="number"
								min="0"
								class={inputClass}
								value={settings.gapResetMs}
								oninput={(e) => {
									settings.gapResetMs = numberOf(e, DEFAULT_GAP_RESET_MS);
									workspace.settingsChanged();
								}}
							/>
						</label>
						<label
							class="flex items-center justify-between gap-3 text-sm text-gray-700"
							title="Fixace běžící už při startu záznamu se živě neuložila"
						>
							Zahodit úvodní fixaci streamu
							<Switch
								bind:checked={settings.dropColdStartFixation}
								onCheckedChange={() => workspace.settingsChanged()}
							/>
						</label>
						<label
							class="block space-y-1 text-sm"
							title="U nahrávek s bridge časem (od 2026-08) odpovídá živému záznamu; automatika to pozná podle nahrávky. U starších nahrávek opraví pozdní razítka hlavního vlákna, časy pak ale nesedí na zaznamenané řádky."
						>
							<span class="text-xs text-gray-500">Opravit časy vzorků (bridge)</span>
							<select
								class={inputClass}
								value={settings.rebaseMode}
								onchange={(e) => {
									settings.rebaseMode = e.currentTarget.value as RebaseMode;
									workspace.settingsChanged();
								}}
							>
								<option value="auto">
									Automaticky ({sim.session.bridgeStamped ? 'zapnuto' : 'vypnuto'} pro toto sezení)
								</option>
								<option value="on">Zapnuto</option>
								<option value="off">Vypnuto</option>
							</select>
						</label>
					</Card.Content>
				</Card.Root>

				{#if selectedProcessor}
					{@const processor = selectedProcessor}
					<Card.Root class="gap-3">
						<Card.Header>
							<Card.Title>Zpracování (server)</Card.Title>
							<Card.Description>{processor.description}</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-3">
							{#if processors.length > 1}
								<select
									class={inputClass}
									value={selectedProcessorName}
									onchange={(e) => {
										selectedProcessorName = e.currentTarget.value;
										parameterErrors = {};
									}}
								>
									{#each processors as option (option.name)}
										<option value={option.name}>{option.label}</option>
									{/each}
								</select>
							{/if}
							{@render layerStatus(processor, selectedLayer)}
							{#if drafts[processor.name]}
								<PostProcessorParameters
									parameters={processor.parameters}
									bind:draft={drafts[processor.name]}
									errors={parameterErrors}
								/>
							{/if}
							<Button
								class="w-full"
								disabled={processing || !sim.canRerun(processor)}
								title={sim.canRerun(processor)
									? 'Spočítá výstup na opravených surových datech; nic se neukládá'
									: 'Simulace umí přepočítat jen zpracování surových dat pohledu'}
								onclick={() => rerunActive()}
							>
								<Icon icon="material-symbols:calculate" class="mr-1 h-4 w-4" />
								{processing ? 'Počítám…' : 'Přepočítat přesně'}
							</Button>
							{#if workspace.slots.length > 1}
								<Button
									size="sm"
									variant="outline"
									class="w-full"
									disabled={processing}
									title="Rozlišení a frekvence se doplní z každého sezení"
									onclick={() => rerunAll()}
								>
									Přepočítat všechna sezení ({workspace.slots.length})
								</Button>
							{/if}
							{#if processingProgress}
								<p class="text-xs text-blue-600">{processingProgress}</p>
							{/if}
							{#if processingStatus}
								<p class="text-xs text-emerald-700">{processingStatus}</p>
							{/if}
							{#each processingErrors as processingError (processingError)}
								<div class="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600">
									{processingError}
								</div>
							{/each}
						</Card.Content>
					</Card.Root>
				{/if}
			{/if}

			{#if workspace.slots.length > 0}
				<Card.Root class="gap-3">
					<Card.Header>
						<Card.Title>Export</Card.Title>
						{#if workspace.slots.length > 1}
							<Card.Description>
								Neotevřená sezení se stáhnou a přepočítají se společným nastavením. Korekci mají jen
								ta, do kterých byla zkopírována. ZIP má strukturu serverového exportu.
							</Card.Description>
						{/if}
					</Card.Header>
					<Card.Content class="space-y-2">
						<Button class="w-full" disabled={exporting} onclick={() => exportCorrected()}>
							<Icon icon="material-symbols:download" class="mr-1 h-4 w-4" />
							{exporting
								? 'Exportuji…'
								: workspace.slots.length > 1
									? `Stáhnout opravená data (${workspace.slots.length} sezení)`
									: 'Stáhnout opravená data (ZIP)'}
						</Button>
						{#if exportProgress}
							<p class="text-xs text-blue-600">{exportProgress}</p>
						{/if}
						{#each exportErrors as exportError (exportError)}
							<div class="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600">{exportError}</div>
						{/each}
					</Card.Content>
				</Card.Root>
			{/if}

			{#if sim?.session}
				<Card.Root class="gap-3">
					<Card.Header>
						<Card.Title>Zobrazení</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						<label class="flex items-center justify-between text-sm text-gray-700">
							Trajektorie pohledu
							<Switch bind:checked={showGaze} />
						</label>
						<label
							class="flex items-center justify-between text-sm text-gray-700"
							title="Čárkovaně = fixace mimo efektivní okno slidu, do skóre se nepočítá"
						>
							Původní data (šedě)
							<Switch bind:checked={showBefore} />
						</label>
						<label
							class="flex items-center justify-between text-sm text-gray-700"
							title="Čárkovaně = fixace mimo efektivní okno slidu, do skóre se nepočítá"
						>
							Přepočtená data (barevně)
							<Switch bind:checked={showAfter} />
						</label>
						{#each simLayers as layer (layer.processor.name)}
							{#if layer.processor.output}
								<label
									class="flex items-center justify-between text-sm text-gray-700"
									title={layer.processor.description}
								>
									{layer.processor.label} ({colorNameOf(layer.processor)})
									<Switch
										checked={!hiddenLayers[layer.processor.name]}
										onCheckedChange={(checked) =>
											(hiddenLayers = { ...hiddenLayers, [layer.processor.name]: !checked })}
									/>
								</label>
							{/if}
						{/each}
						<label class="flex items-center justify-between text-sm text-gray-700">
							AOI oblasti
							<Switch bind:checked={showAois} />
						</label>
					</Card.Content>
				</Card.Root>
			{/if}
		</aside>

		<main
			class="sticky top-4 max-h-[calc(100vh-2rem)] min-w-0 flex-1 space-y-4 self-start overflow-y-auto"
		>
			<StimulusStage
				level={selectedResolved?.level ?? null}
				stimulus={selectedResolved?.stimulus ?? null}
				width={stageWidth}
				height={stageHeight}
				{overlay}
			/>

			{#if sim?.session}
				<Card.Root class="gap-3">
					<Card.Header>
						<Card.Title>Info o slidu {sim.selectedSlide ?? '–'}</Card.Title>
						{#if !selectedWindow}
							<Card.Description>Chybí kompletní časové okno.</Card.Description>
						{/if}
					</Card.Header>
					<Card.Content>
						<ScoreComparison recorded={recordedScore} recomputed={recomputedScore} />
					</Card.Content>
				</Card.Root>
			{/if}
		</main>
	</div>
</DefaultLayout>

<OffscreenStimulusStage bind:this={captureStage} />
<SessionLoadDialog bind:open={loadDialogOpen} onConfirm={handleSourcesPicked} />
