<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Icon from '@iconify/svelte';
	import DefaultLayout from '$lib/components/layout/DefaultLayout.svelte';
	import BackButton from '$lib/components/layout/BackButton.svelte';
	import OffscreenStimulusStage from '$lib/components/OffscreenStimulusStage.svelte';
	import SessionLoadDialog from '$lib/components/SessionLoadDialog.svelte';
	import StimulusStage from '$lib/components/StimulusStage.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Slider } from '$lib/components/ui/slider';
	import { Switch } from '$lib/components/ui/switch';
	import HeatmapCanvas, { type HeatmapPoint } from './components/HeatmapCanvas.svelte';
	import HeatmapOverlay, {
		type ClickMarker,
		type GazePoint,
		type HoverItem
	} from './components/HeatmapOverlay.svelte';
	import type { FixationDataEntry } from '$lib/database/db.types';
	import { DatabaseExporter } from '$lib/utils/databaseExport';
	import {
		describeSession,
		type SessionView,
		type ViewportSource
	} from '$lib/utils/sessionSim/sessionView';
	import type { AoiRect, LoadedSession, SessionSource } from '$lib/utils/sessionSim/types';
	import { canvasToBlob, captureToCanvas, downloadBlob } from '$lib/utils/stimulusExport/capture';

	let loadDialogOpen = $state(true);
	let captureStage = $state<OffscreenStimulusStage | null>(null);
	let stage = $state<StimulusStage | null>(null);

	// ── Session ──
	type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
	let source = $state.raw<SessionSource | null>(null);
	let session = $state.raw<LoadedSession | null>(null);
	let view = $state.raw<SessionView | null>(null);
	let loadStatus = $state<LoadStatus>('idle');
	let loadError = $state('');

	async function handleSourcesPicked(sources: SessionSource[]) {
		const picked = sources[0];
		if (!picked) return;
		source = picked;
		session = null;
		view = null;
		loadStatus = 'loading';
		loadError = '';
		try {
			const loaded = await picked.load();
			if (source === picked) applySession(loaded);
		} catch (err) {
			if (source !== picked) return;
			loadStatus = 'error';
			loadError = err instanceof Error ? err.message : 'Nepodařilo se načíst data';
		}
	}

	function applySession(loaded: LoadedSession) {
		const described = describeSession(loaded);
		session = loaded;
		view = described;
		loadStatus = 'ready';
		if (described.viewport) {
			viewportW = described.viewport.width;
			viewportH = described.viewport.height;
			stageW = described.viewport.width;
			stageH = described.viewport.height;
		}
		viewportSource = described.viewportSource;
		capturedAois = {};
		selectSlide(described.slides[0] ?? null);
		if (showAois) void ensureGeometry();
	}

	async function openLoadDialog() {
		if (document.fullscreenElement) await document.exitFullscreen();
		loadDialogOpen = true;
	}

	function formatSessionDate(sessionId: string): string {
		const ms = parseFloat(sessionId);
		return Number.isFinite(ms) ? DatabaseExporter.formatTimestamp(ms, 'simple') : sessionId;
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
	let stageW = $state(1920);
	let stageH = $state(1080);
	let viewportSource = $state<ViewportSource>('manual');

	function applyViewport(width = viewportW, height = viewportH) {
		if (!(width > 0 && height > 0)) return;
		viewportW = width;
		viewportH = height;
		if (width === stageW && height === stageH) return;
		stageW = width;
		stageH = height;
		viewportSource = 'manual';
		capturedAois = {};
		if (showAois) void ensureGeometry();
	}

	// ── Slides ──
	let selectedSlide = $state<number | null>(null);
	const slides = $derived(view?.slides ?? []);
	const slidePosition = $derived(selectedSlide === null ? -1 : slides.indexOf(selectedSlide));
	const resolved = $derived(
		view && selectedSlide !== null ? (view.resolvedBySlide[selectedSlide] ?? null) : null
	);
	const stimulusId = $derived(
		view && selectedSlide !== null ? (view.stimulusBySlide[selectedSlide] ?? 'null') : null
	);

	function slideTimeOf(slide: number | null): { start: number; span: number } {
		let start = Infinity;
		let end = -Infinity;
		if (session && slide !== null) {
			for (const sample of session.gazeSamples) {
				if (sample.slide_index !== slide) continue;
				if (sample.timestamp < start) start = sample.timestamp;
				if (sample.timestamp > end) end = sample.timestamp;
			}
		}
		if (start === Infinity) return { start: 0, span: 0 };
		return { start, span: Math.ceil((end - start) / WINDOW_STEP_MS) * WINDOW_STEP_MS };
	}

	function selectSlide(slide: number | null) {
		selectedSlide = slide;
		hover = null;
		windowRange = [0, slideTimeOf(slide).span];
	}

	function stepSlide(delta: number) {
		const next = slides[slidePosition + delta];
		if (next !== undefined) selectSlide(next);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (loadDialogOpen || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('input, select, textarea, [role="slider"], [contenteditable]')) return;
		event.preventDefault();
		stepSlide(event.key === 'ArrowLeft' ? -1 : 1);
	}

	// ── Time window ──
	const WINDOW_STEP_MS = 10;
	let windowRange = $state<number[]>([0, 0]);
	const slideTime = $derived(slideTimeOf(selectedSlide));
	const windowNarrowed = $derived(windowRange[0] > 0 || windowRange[1] < slideTime.span);
	const windowFrom = $derived(slideTime.start + windowRange[0]);
	const windowTo = $derived(slideTime.start + windowRange[1]);

	function inWindow(timestamp: number): boolean {
		return !windowNarrowed || (timestamp >= windowFrom && timestamp <= windowTo);
	}

	function formatSeconds(ms: number): string {
		const seconds = (ms / 1000).toLocaleString('cs-CZ', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
		return `${seconds} s`;
	}

	function offsetLabel(timestamp: number): string {
		return `+${formatSeconds(timestamp - slideTime.start)}`;
	}

	// ── Per-slide data ──
	const slideSamples = $derived(
		session && selectedSlide !== null
			? session.gazeSamples.filter((sample) => sample.slide_index === selectedSlide)
			: []
	);
	const windowSamples = $derived(slideSamples.filter((sample) => inWindow(sample.timestamp)));
	const slideFixationCount = $derived(
		session ? session.fixationData.filter((f) => f.slide_index === selectedSlide).length : 0
	);

	let heatSource = $state<'eyetracker' | 'mouse'>('eyetracker');
	const heatPoints = $derived.by((): HeatmapPoint[] => {
		const points: HeatmapPoint[] = [];
		for (const sample of windowSamples) {
			const x = heatSource === 'mouse' ? sample.mouse_x : sample.eyetracker_x;
			const y = heatSource === 'mouse' ? sample.mouse_y : sample.eyetracker_y;
			if (x === null || y === null || !Number.isFinite(x) || !Number.isFinite(y)) continue;
			points.push({ x, y, value: 1 });
		}
		return points;
	});
	// A spot collecting about 4 % of the slide's samples saturates the gradient.
	const heatMax = $derived(Math.min(100, Math.max(5, Math.round(heatPoints.length / 25))));

	const gazePath = $derived.by((): GazePoint[] => {
		const points: GazePoint[] = [];
		for (const sample of windowSamples) {
			if (sample.eyetracker_x === null || sample.eyetracker_y === null) continue;
			points.push({ x: sample.eyetracker_x, y: sample.eyetracker_y });
		}
		return points;
	});

	function slideFixations(rows: FixationDataEntry[]): FixationDataEntry[] {
		return rows.filter((f) => f.slide_index === selectedSlide && inWindow(f.timestamp));
	}
	const fixations = $derived(session ? slideFixations(session.fixationData) : []);
	const i2mcFixations = $derived(session ? slideFixations(session.i2mcFixationData) : []);
	const hasI2mc = $derived((session?.i2mcFixationData.length ?? 0) > 0);

	const clicks = $derived.by((): ClickMarker[] => {
		const markers: ClickMarker[] = [];
		for (const sample of windowSamples) {
			const event = sample.events.find((ev) => ev.startsWith('select_'));
			if (event) {
				markers.push({ x: sample.mouse_x, y: sample.mouse_y, event, timestamp: sample.timestamp });
			}
		}
		return markers;
	});

	// ── AOI geometry ──
	let capturedAois = $state.raw<Record<number, AoiRect[]>>({});
	let captureProgress = $state<string | null>(null);
	let captureRun: Promise<void> | null = null;

	const aois = $derived.by((): AoiRect[] => {
		if (selectedSlide === null) return [];
		return view?.recordedAois[selectedSlide] ?? capturedAois[selectedSlide] ?? [];
	});
	const geometrySource = $derived.by((): 'recorded' | 'captured' | null => {
		if (selectedSlide === null) return null;
		if (view?.recordedAois[selectedSlide]) return 'recorded';
		if (capturedAois[selectedSlide]) return 'captured';
		return null;
	});

	function ensureGeometry(): Promise<void> {
		if (!captureRun) captureRun = captureGeometry().finally(() => (captureRun = null));
		return captureRun;
	}

	/** Renders every slide without recorded geometry offscreen and reads its AOI rects. */
	async function captureGeometry() {
		const current = session;
		const described = view;
		const viewport = { width: stageW, height: stageH };
		if (!current || !described || !captureStage) return;
		try {
			for (const slide of described.slides) {
				const resolvedSlide = described.resolvedBySlide[slide];
				if (!resolvedSlide || described.recordedAois[slide] || capturedAois[slide]) continue;
				captureProgress = `Načítám geometrii slidu ${slide}…`;
				const rects = await captureStage.capture(resolvedSlide, viewport);
				if (session !== current || stageW !== viewport.width || stageH !== viewport.height) return;
				capturedAois = { ...capturedAois, [slide]: rects };
			}
		} finally {
			captureProgress = null;
		}
	}

	$effect(() => {
		if (showAois && session) untrack(() => void ensureGeometry());
	});

	// ── Layers ──
	let showStimulus = $state(true);
	let showHeatmap = $state(true);
	let showPath = $state(false);
	let showFixations = $state(true);
	let showI2mc = $state(false);
	let showClicks = $state(false);
	let showAois = $state(false);

	// ── Heatmap ──
	let heatRadius = $state(40);
	let heatOpacity = $state(0.6);
	const heatConfig = $derived({
		radius: heatRadius,
		maxOpacity: heatOpacity,
		minOpacity: 0,
		blur: 0.75
	});

	// ── Hover ──
	let hover = $state<{ item: HoverItem; x: number; y: number } | null>(null);

	function handleHover(item: HoverItem | null, event: PointerEvent) {
		hover = item ? { item, x: event.clientX, y: event.clientY } : null;
	}

	// ── Fullscreen ──
	let workspaceEl = $state<HTMLElement | null>(null);
	let isFullscreen = $state(false);
	let windowHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 1080);
	const stageMaxHeight = $derived(isFullscreen ? windowHeight - 84 : windowHeight * 0.75);

	function toggleFullscreen() {
		if (document.fullscreenElement) void document.exitFullscreen();
		else void workspaceEl?.requestFullscreen();
	}

	function syncFullscreen() {
		isFullscreen = workspaceEl !== null && document.fullscreenElement === workspaceEl;
	}

	// ── Export ──
	let exporting = $state(false);
	let exportError = $state('');
	const exportName = $derived(
		session && selectedSlide !== null
			? `heatmap_${session.exportFolder.replace(/\//g, '_')}_slide${selectedSlide}.png`
			: 'heatmap.png'
	);

	async function exportPng() {
		const node = stage?.getContentNode();
		if (!node || exporting) return;
		exporting = true;
		exportError = '';
		try {
			const canvas = await captureToCanvas(node, 1);
			downloadBlob(await canvasToBlob(canvas, 'png', 1), exportName);
		} catch (err) {
			exportError = err instanceof Error ? err.message : 'Export selhal';
		} finally {
			exporting = false;
		}
	}

	function numberOf(event: Event, fallback = 0): number {
		const value = parseFloat((event.currentTarget as HTMLInputElement).value);
		return Number.isFinite(value) ? value : fallback;
	}

	const inputClass =
		'w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800';
	const switchRowClass = 'flex items-center justify-between text-sm text-gray-700';
</script>

<svelte:head>
	<title>Heatmapa - DeveLex Tasks</title>
</svelte:head>

<svelte:window bind:innerHeight={windowHeight} onkeydown={handleKeydown} />
<svelte:document onfullscreenchange={syncFullscreen} />

{#snippet overlay()}
	{#if showHeatmap}
		<HeatmapCanvas
			data={heatPoints}
			max={heatMax}
			width={stageW}
			height={stageH}
			config={heatConfig}
		/>
	{/if}
	<HeatmapOverlay
		width={stageW}
		height={stageH}
		{gazePath}
		{fixations}
		{i2mcFixations}
		{clicks}
		{aois}
		{showPath}
		{showFixations}
		showI2mc={showI2mc && hasI2mc}
		{showClicks}
		{showAois}
		onHover={handleHover}
	/>
{/snippet}

<DefaultLayout wide>
	<BackButton label="Zpět do hlavní nabídky" onclick={() => goto(resolve(`/`))} />

	<h1 class="text-2xl font-black text-gray-800">Heatmapa</h1>

	<div
		bind:this={workspaceEl}
		class="flex items-start gap-6 {isFullscreen ? 'h-screen overflow-hidden bg-gray-50 p-4' : ''}"
	>
		<main
			class="min-w-0 flex-1 {isFullscreen
				? 'flex h-full flex-col items-center justify-center gap-3'
				: 'sticky top-4 space-y-3 self-start'}"
		>
			{#if session && view}
				<StimulusStage
					bind:this={stage}
					level={showStimulus ? (resolved?.level ?? null) : null}
					stimulus={showStimulus ? (resolved?.stimulus ?? null) : null}
					width={stageW}
					height={stageH}
					maxHeight={stageMaxHeight}
					{overlay}
				/>
				<div class="flex w-full justify-end">
					<Button variant="outline" size="sm" onclick={toggleFullscreen}>
						<Icon
							icon={isFullscreen
								? 'material-symbols:fullscreen-exit'
								: 'material-symbols:fullscreen'}
							class="mr-1 h-4 w-4"
						/>
						{isFullscreen ? 'Ukončit celou obrazovku' : 'Celá obrazovka'}
					</Button>
				</div>
			{:else}
				<div
					class="flex aspect-video w-full items-center justify-center rounded-md border border-dashed border-gray-300 bg-white text-sm text-gray-500"
				>
					{#if loadStatus === 'loading'}
						Stahuji data sezení…
					{:else if loadStatus === 'error'}
						<span class="text-red-600">{loadError}</span>
					{:else}
						Žádné sezení nenačteno.
					{/if}
				</div>
			{/if}
		</main>

		<aside class="w-80 shrink-0 space-y-4 {isFullscreen ? 'max-h-full overflow-y-auto' : ''}">
			<Card.Root class="gap-3">
				<Card.Header>
					<Card.Title>Sezení</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3">
					{#if loadStatus === 'loading'}
						<div class="text-xs text-blue-600">Stahuji data sezení…</div>
					{:else if loadStatus === 'error'}
						<div class="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600">{loadError}</div>
					{:else if session}
						<div class="text-sm text-gray-700">
							<div><span class="text-gray-400">Dítě:</span> {session.childId}</div>
							<div><span class="text-gray-400">Úloha:</span> {session.taskName}</div>
							<div>
								<span class="text-gray-400">Datum:</span>
								{formatSessionDate(session.sessionId)}
							</div>
							<div><span class="text-gray-400">Vzorků:</span> {session.gazeSamples.length}</div>
						</div>
					{:else}
						<p class="text-sm text-gray-500">Žádné sezení nenačteno.</p>
					{/if}
					<Button class="w-full" onclick={openLoadDialog}>
						<Icon icon="material-symbols:folder-open" class="mr-1 h-4 w-4" />
						Načíst sezení
					</Button>
					{#if session && view && !view.parsedTask}
						<div class="rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
							Neznámý název úlohy „{session.taskName}“ – stimuly nelze vykreslit.
						</div>
					{/if}
					{#each session?.warnings ?? [] as warning (warning)}
						<div class="rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-700">{warning}</div>
					{/each}
				</Card.Content>
			</Card.Root>

			{#if session && view}
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
								onclick={() => stepSlide(-1)}
							>
								<Icon icon="material-symbols:chevron-left" class="h-4 w-4" />
							</Button>
							<select
								class={inputClass}
								value={selectedSlide}
								onchange={(e) => selectSlide(Number(e.currentTarget.value))}
							>
								{#each slides as slide (slide)}
									<option value={slide}>Slide {slide}</option>
								{/each}
							</select>
							<Button
								size="sm"
								variant="outline"
								disabled={slidePosition < 0 || slidePosition >= slides.length - 1}
								onclick={() => stepSlide(1)}
							>
								<Icon icon="material-symbols:chevron-right" class="h-4 w-4" />
							</Button>
						</div>
						<div class="text-xs text-gray-500">
							Stimul: <span class="font-mono">{stimulusId ?? '–'}</span>
							{#if selectedSlide !== null && !resolved}
								<span class="ml-1 rounded bg-amber-100 px-1 py-0.5 font-semibold text-amber-700">
									nelze vykreslit
								</span>
							{/if}
							{#if geometrySource === 'recorded'}
								<span class="ml-1 rounded bg-emerald-100 px-1 py-0.5 text-emerald-700">
									geometrie z nahrávky
								</span>
							{:else if geometrySource === 'captured'}
								<span class="ml-1 rounded bg-gray-100 px-1 py-0.5 text-gray-600">
									geometrie z vykreslení
								</span>
							{:else if showAois}
								<span class="ml-1 rounded bg-gray-100 px-1 py-0.5 text-gray-500">
									geometrie nenačtena
								</span>
							{/if}
						</div>
						<div class="text-xs text-gray-500">
							{slideSamples.length} vzorků · {slideFixationCount} fixací
						</div>
						{#if captureProgress}
							<div class="text-xs text-blue-600">{captureProgress}</div>
						{/if}
						<div class="space-y-2" title="Omezí všechny vrstvy na část slidu">
							<div class="flex items-center justify-between text-xs text-gray-500">
								<span>Časové okno</span>
								<span>{formatSeconds(windowRange[0])} – {formatSeconds(windowRange[1])}</span>
							</div>
							<Slider
								type="multiple"
								bind:value={windowRange}
								min={0}
								max={slideTime.span}
								step={WINDOW_STEP_MS}
								disabled={slideTime.span === 0}
							/>
							{#if windowNarrowed}
								<button
									type="button"
									class="text-xs text-blue-600 hover:underline"
									onclick={() => (windowRange = [0, slideTime.span])}
								>
									Celý slide
								</button>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root class="gap-3">
					<Card.Header>
						<Card.Title>Vrstvy</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						<label class={switchRowClass}>
							Stimul
							<Switch bind:checked={showStimulus} />
						</label>
						<label class={switchRowClass}>
							Heatmapa
							<Switch bind:checked={showHeatmap} />
						</label>
						<label class={switchRowClass}>
							Trajektorie pohledu
							<Switch bind:checked={showPath} />
						</label>
						<label class={switchRowClass} title="Velikost kruhu odpovídá délce fixace">
							Fixace
							<Switch bind:checked={showFixations} />
						</label>
						{#if hasI2mc}
							<label class={switchRowClass} title="Referenční fixace ze serverového I2MC">
								I2MC fixace (oranžově)
								<Switch bind:checked={showI2mc} />
							</label>
						{/if}
						<label class={switchRowClass} title="Události select_ na pozici myši">
							Kliknutí
							<Switch bind:checked={showClicks} />
						</label>
						<label class={switchRowClass}>
							AOI oblasti
							<Switch bind:checked={showAois} />
						</label>
					</Card.Content>
				</Card.Root>

				<Card.Root class="gap-3">
					<Card.Header>
						<Card.Title>Heatmapa</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						<label class="block space-y-1 text-sm">
							<span class="text-xs text-gray-500">Zdroj</span>
							<select class={inputClass} bind:value={heatSource}>
								<option value="eyetracker">Eyetracker</option>
								<option value="mouse">Pozice myši</option>
							</select>
						</label>
						<div class="space-y-2">
							<div class="flex items-center justify-between text-xs text-gray-500">
								<span>Poloměr</span>
								<span>{heatRadius} px</span>
							</div>
							<Slider type="single" bind:value={heatRadius} min={10} max={120} step={5} />
						</div>
						<div class="space-y-2">
							<div class="flex items-center justify-between text-xs text-gray-500">
								<span>Průhlednost</span>
								<span>{Math.round(heatOpacity * 100)} %</span>
							</div>
							<Slider type="single" bind:value={heatOpacity} min={0.1} max={1} step={0.05} />
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root class="gap-3">
					<Card.Header>
						<Card.Title>Export</Card.Title>
						<Card.Description>
							Aktuální slide s viditelnými vrstvami, {stageW} × {stageH} px.
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-2">
						<Button class="w-full" disabled={exporting} onclick={() => exportPng()}>
							<Icon icon="material-symbols:image" class="mr-1 h-4 w-4" />
							{exporting ? 'Exportuji…' : 'Exportovat PNG'}
						</Button>

						{#if exportError}
							<div class="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600">{exportError}</div>
						{/if}
					</Card.Content>
				</Card.Root>

				<Card.Root class="gap-3">
					<Card.Header>
						<Card.Title>Viewport nahrávky</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						{#if viewportSource !== 'manual'}
							<div class="rounded-md bg-emerald-50 px-2 py-1.5 text-xs text-emerald-700">
								Rozlišení {viewportSource === 'geometry'
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
					</Card.Content>
				</Card.Root>
			{/if}
		</aside>

		{#if hover}
			{@const item = hover.item}
			<div
				class="pointer-events-none fixed z-50 rounded-md bg-gray-900/90 px-2 py-1 text-xs text-white shadow-lg"
				style="left: {hover.x + 14}px; top: {hover.y + 14}px;"
			>
				{#if item.kind === 'click'}
					<div class="font-semibold">Kliknutí {item.index + 1}</div>
					<div>{item.click.event} · {offsetLabel(item.click.timestamp)}</div>
				{:else}
					<div class="font-semibold">
						{item.kind === 'i2mc' ? 'I2MC fixace' : 'Fixace'}
						{item.index + 1}
					</div>
					<div>
						{Math.round(item.fixation.duration)} ms · {offsetLabel(item.fixation.timestamp)}
					</div>
					<div>AOI: {item.fixation.aoi.length > 0 ? item.fixation.aoi.join(', ') : '–'}</div>
				{/if}
			</div>
		{/if}
	</div>
</DefaultLayout>

<OffscreenStimulusStage bind:this={captureStage} />
<SessionLoadDialog bind:open={loadDialogOpen} multiSelect={false} onConfirm={handleSourcesPicked} />
