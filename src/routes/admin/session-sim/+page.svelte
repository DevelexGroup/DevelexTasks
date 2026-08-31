<script lang="ts">
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import DefaultLayout from '$lib/components/layout/DefaultLayout.svelte';
	import BackButton from '$lib/components/layout/BackButton.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import Icon from '@iconify/svelte';
	import SimStage from './components/SimStage.svelte';
	import SessionLoadDialog from './components/SessionLoadDialog.svelte';
	import GazeOverlay, {
		type GazePoint,
		type OverlayFixation
	} from './components/GazeOverlay.svelte';
	import ScoreComparison from './components/ScoreComparison.svelte';
	import { captureAoiRects } from './components/aoiCapture';
	import { downloadBlob, settleStimulus } from '$lib/utils/stimulusExport/capture';
	import { DatabaseExporter } from '$lib/utils/databaseExport';
	import type { RawGazeDataEntry } from '$lib/database/db.types';
	import { buildCorrectedZip, correctedZipName } from '$lib/utils/sessionSim/export';
	import { SessionSimState } from '$lib/utils/sessionSim/simState.svelte';
	import { IDENTITY_MATRIX } from '$lib/utils/sessionSim/transform';
	import {
		DEFAULT_GAP_RESET_MS,
		type CorrectionMatrix,
		type LoadedSession
	} from '$lib/utils/sessionSim/types';

	const sim = new SessionSimState();

	let loadDialogOpen = $state(true);
	let stage = $state<SimStage | null>(null);

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

	function applyViewport(width = viewportW, height = viewportH) {
		viewportW = width;
		viewportH = height;
		sim.setViewport(width, height);
		void captureAllGeometry();
	}

	// ── Geometry capture ──
	let captureProgress = $state<string | null>(null);
	let capturingAll = false;

	const missingGeometry = $derived(
		sim.slides.filter((slide) => sim.resolvedBySlide[slide] && !sim.capturedAois[slide])
	);

	async function waitForStage(): Promise<HTMLElement | null> {
		for (let i = 0; i < 120; i++) {
			const node = stage?.getCaptureNode();
			if (node && (stage?.getFitScale() ?? 0) > 0) return node;
			await new Promise(requestAnimationFrame);
		}
		return null;
	}

	async function ensureGeometry(slide: number) {
		if (!sim.resolvedBySlide[slide] || sim.capturedAois[slide]) return;
		await tick();
		const node = await waitForStage();
		if (!node || sim.selectedSlide !== slide) return;
		await settleStimulus(node);
		if (sim.selectedSlide !== slide) return;
		sim.registerGeometry(slide, captureAoiRects(node));
	}

	async function captureAllGeometry() {
		if (!sim.session || capturingAll) return;
		capturingAll = true;
		const original = sim.selectedSlide;
		try {
			for (const slide of sim.slides) {
				if (sim.capturedAois[slide] || !sim.resolvedBySlide[slide]) continue;
				captureProgress = `Načítám geometrii slidu ${slide}…`;
				sim.selectedSlide = slide;
				await ensureGeometry(slide);
			}
		} finally {
			if (original !== null) sim.selectedSlide = original;
			captureProgress = null;
			capturingAll = false;
		}
	}

	function selectSlide(slide: number) {
		sim.selectedSlide = slide;
		void ensureGeometry(slide);
	}

	function handleSessionLoaded(session: LoadedSession) {
		sim.loadSession(session);
		void captureAllGeometry();
	}

	// ── Derived per-slide view data ──
	const selectedResolved = $derived(
		sim.selectedSlide !== null ? (sim.resolvedBySlide[sim.selectedSlide] ?? null) : null
	);
	const selectedWindow = $derived(
		sim.selectedSlide !== null
			? (sim.result?.perSlide.get(sim.selectedSlide)?.window ?? null)
			: null
	);
	const stageAois = $derived(sim.geometryFor(sim.selectedSlide)?.aois ?? []);

	// The preview shows everything recorded on the slide; the score only counts
	// what falls inside the effective window, so the rest is drawn dimmed.
	function slideGaze(rows: RawGazeDataEntry[]): GazePoint[] {
		return rows
			.filter((r) => r.slide_index === sim.selectedSlide && (r.validityL || r.validityR))
			.map((r) => ({ x: r.x, y: r.y }));
	}
	const gazeBefore = $derived(sim.session ? slideGaze(sim.session.rawGazeData) : []);
	const gazeAfter = $derived(sim.result ? slideGaze(sim.result.rawGazeData) : []);
	const fixationsBefore = $derived.by((): OverlayFixation[] => {
		if (!sim.session) return [];
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
			sim.selectedSlide !== null ? sim.result?.perSlide.get(sim.selectedSlide) : undefined;
		if (!slideResult) return [];
		const counted = new Set(slideResult.fixations.map((f) => f.fixation_index));
		return slideResult.allFixations.map((f) => ({ ...f, counted: counted.has(f.fixation_index) }));
	});
	const recordedScore = $derived(
		sim.session?.sessionScores.find((s) => s.slide_index === sim.selectedSlide) ?? null
	);
	const recomputedScore = $derived(
		sim.result?.sessionScores.find((s) => s.slide_index === sim.selectedSlide) ?? null
	);
	const outsideShare = $derived.by(() => {
		if (gazeAfter.length === 0) return 0;
		const outside = gazeAfter.filter(
			(p) => p.x < 0 || p.y < 0 || p.x > sim.viewportWidth || p.y > sim.viewportHeight
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

	function updateDetector(patch: Partial<typeof sim.detectorParams>) {
		sim.detectorParams = { ...sim.detectorParams, ...patch };
		sim.scheduleRecompute();
	}

	function formatSessionDate(sessionId: string): string {
		const ms = parseFloat(sessionId);
		return Number.isFinite(ms) ? DatabaseExporter.formatTimestamp(ms, 'simple') : sessionId;
	}

	// ── Matrix correction ──
	const activeMatrix = $derived(sim.activeCorrection.matrix ?? IDENTITY_MATRIX);

	function updateMatrixCell(index: number, value: number) {
		const next = [...activeMatrix] as CorrectionMatrix;
		next[index] = value;
		sim.updateCorrection({ matrix: next });
	}

	// ── Export ──
	let exporting = $state(false);

	async function exportCorrected() {
		if (!sim.session || !sim.result || exporting) return;
		exporting = true;
		try {
			sim.recomputeNow();
			const blob = await buildCorrectedZip(sim.result, {
				session: sim.session,
				viewport: { width: sim.viewportWidth, height: sim.viewportHeight },
				sessionCorrection: sim.sessionCorrection,
				slideOverrides: sim.slideOverrides,
				detectorParams: sim.detectorParams,
				aoiAttribution: sim.aoiAttribution,
				dropUnfinishedFinalFixation: sim.dropUnfinishedFinalFixation,
				countFixationsOpenAtWindowEnd: sim.countFixationsOpenAtWindowEnd,
				gapResetMs: sim.gapResetMs,
				dropColdStartFixation: sim.dropColdStartFixation,
				rebaseRawTimestamps: sim.rebaseRawTimestamps,
				synthesizeDwellArrow: sim.synthesizeDwellArrow,
				synthesizeDwellEye: sim.synthesizeDwellEye
			});
			downloadBlob(blob, correctedZipName(sim.session));
		} finally {
			exporting = false;
		}
	}

	const slidePosition = $derived(
		sim.selectedSlide !== null ? sim.slides.indexOf(sim.selectedSlide) : -1
	);

	const inputClass =
		'w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800';
	const matrixInputClass =
		'w-full rounded-md border border-gray-300 bg-white px-1 py-1 text-center text-xs text-gray-800';
</script>

<svelte:head>
	<title>Simulace sezení - DeveLex Tasks</title>
</svelte:head>

{#snippet overlay()}
	<GazeOverlay
		width={sim.viewportWidth}
		height={sim.viewportHeight}
		{gazeBefore}
		{gazeAfter}
		{fixationsBefore}
		{fixationsAfter}
		aois={stageAois}
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
		{#if sim.recomputeMs !== null}
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
					{#if sim.session}
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
					{#if sim.error}
						<div class="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600">{sim.error}</div>
					{/if}
					{#each sim.warnings as warning (warning)}
						<div class="rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-700">{warning}</div>
					{/each}
				</Card.Content>
			</Card.Root>

			{#if sim.session}
				<Card.Root class="gap-3">
					<Card.Header>
						<Card.Title>Viewport nahrávky</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
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
								onclick={() => selectSlide(sim.slides[slidePosition - 1])}
							>
								<Icon icon="material-symbols:chevron-left" class="h-4 w-4" />
							</Button>
							<select
								class={inputClass}
								value={sim.selectedSlide}
								onchange={(e) => selectSlide(Number(e.currentTarget.value))}
							>
								{#each sim.slides as slide (slide)}
									<option value={slide}>Slide {slide}</option>
								{/each}
							</select>
							<Button
								size="sm"
								variant="outline"
								disabled={slidePosition < 0 || slidePosition >= sim.slides.length - 1}
								onclick={() => selectSlide(sim.slides[slidePosition + 1])}
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
							{:else if sim.selectedSlide !== null && !sim.capturedAois[sim.selectedSlide]}
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
								onclick={() => captureAllGeometry()}
							>
								Načíst chybějící geometrii ({missingGeometry.length})
							</Button>
						{/if}
					</Card.Content>
				</Card.Root>

				<Card.Root class="gap-3">
					<Card.Header>
						<Card.Title>Prostorová korekce</Card.Title>
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
					</Card.Content>
				</Card.Root>

				<Card.Root class="gap-3">
					<Card.Header>
						<Card.Title>Detekce fixací</Card.Title>
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
									value={sim.detectorParams.minimumFixationDurationMs}
									oninput={(e) => updateDetector({ minimumFixationDurationMs: numberOf(e, 100) })}
								/>
							</label>
							<label class="space-y-1">
								<span class="text-xs text-gray-500">Max. disperze (°)</span>
								<input
									type="number"
									step="0.05"
									class={inputClass}
									value={sim.detectorParams.maximumFixationDispersionDeg}
									oninput={(e) =>
										updateDetector({ maximumFixationDispersionDeg: numberOf(e, 1.35) })}
								/>
							</label>
							<label class="space-y-1">
								<span class="text-xs text-gray-500">Vzdálenost (cm)</span>
								<input
									type="number"
									class={inputClass}
									value={sim.detectorParams.distanceFromScreenCm}
									oninput={(e) => updateDetector({ distanceFromScreenCm: numberOf(e, 70) })}
								/>
							</label>
							<label class="space-y-1">
								<span class="text-xs text-gray-500">DPI</span>
								<input
									type="number"
									class={inputClass}
									value={sim.detectorParams.dpi}
									oninput={(e) => updateDetector({ dpi: numberOf(e, 96) })}
								/>
							</label>
						</div>
						<label class="block space-y-1 text-sm">
							<span class="text-xs text-gray-500">Přiřazení AOI k fixaci</span>
							<select
								class={inputClass}
								value={sim.aoiAttribution}
								onchange={(e) => {
									sim.aoiAttribution = e.currentTarget.value as typeof sim.aoiAttribution;
									sim.scheduleRecompute();
								}}
							>
								<option value="snapshot-at-start">Při začátku fixace (živě)</option>
								<option value="centroid">Podle těžiště</option>
							</select>
						</label>
						<label
							class="flex items-center justify-between text-sm text-gray-700"
							title="Syntetické AOI slide-N_end pro šipku dalšího slidu"
						>
							Doplnit AOI šipky
							<Switch
								bind:checked={sim.synthesizeDwellArrow}
								onCheckedChange={() => sim.scheduleRecompute()}
							/>
						</label>
						<label
							class="flex items-center justify-between text-sm text-gray-700"
							title="Syntetické AOI slide-N_initial pro úvodní oko"
						>
							Doplnit AOI oka
							<Switch
								bind:checked={sim.synthesizeDwellEye}
								onCheckedChange={() => sim.scheduleRecompute()}
							/>
						</label>
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
								bind:checked={sim.dropUnfinishedFinalFixation}
								onCheckedChange={() => sim.scheduleRecompute()}
							/>
						</label>
						<label
							class="flex items-center justify-between gap-3 text-sm text-gray-700"
							title="Fixace běžící při dokončení slidu se živě nezapočítá nikam"
						>
							Počítat fixace přes konec slidu
							<Switch
								bind:checked={sim.countFixationsOpenAtWindowEnd}
								onCheckedChange={() => sim.scheduleRecompute()}
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
								value={sim.gapResetMs}
								oninput={(e) => {
									sim.gapResetMs = numberOf(e, DEFAULT_GAP_RESET_MS);
									sim.scheduleRecompute();
								}}
							/>
						</label>
						<label
							class="flex items-center justify-between gap-3 text-sm text-gray-700"
							title="Fixace běžící už při startu záznamu se živě neuložila"
						>
							Zahodit úvodní fixaci streamu
							<Switch
								bind:checked={sim.dropColdStartFixation}
								onCheckedChange={() => sim.scheduleRecompute()}
							/>
						</label>
						<label
							class="flex items-center justify-between gap-3 text-sm text-gray-700"
							title="Hlavní vlákno razítkuje vzorky pozdě a v dávkách; bridge čas je spojitý. Vzorky i fixace dostanou skutečné časy (fixace čas začátku)."
						>
							Opravit časy vzorků (bridge)
							<Switch
								bind:checked={sim.rebaseRawTimestamps}
								onCheckedChange={() => sim.scheduleRecompute()}
							/>
						</label>
					</Card.Content>
				</Card.Root>

				<Card.Root class="gap-3">
					<Card.Header>
						<Card.Title>Export</Card.Title>
					</Card.Header>
					<Card.Content>
						<Button
							class="w-full"
							disabled={!sim.result || exporting}
							onclick={() => exportCorrected()}
						>
							<Icon icon="material-symbols:download" class="mr-1 h-4 w-4" />
							{exporting ? 'Exportuji…' : 'Stáhnout opravená data (ZIP)'}
						</Button>
					</Card.Content>
				</Card.Root>

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
			<SimStage
				bind:this={stage}
				level={selectedResolved?.level ?? null}
				stimulus={selectedResolved?.stimulus ?? null}
				width={sim.viewportWidth}
				height={sim.viewportHeight}
				{overlay}
			/>

			{#if sim.session}
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

<SessionLoadDialog bind:open={loadDialogOpen} onConfirm={handleSessionLoaded} />
