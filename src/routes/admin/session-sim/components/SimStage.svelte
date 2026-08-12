<script lang="ts">
	import { setContext, type Snippet } from 'svelte';
	import { on } from 'svelte/events';
	import { SCREENSHOT_MODE_KEY, type ScreenshotModeContext } from '$lib/types/general.types';
	import {
		buildSingleStimulusPreset,
		type ExportableLevel,
		type ExportStimulus
	} from '$lib/utils/stimulusExport/registry';

	interface Props {
		level: ExportableLevel | null;
		stimulus: ExportStimulus | null;
		width: number;
		height: number;
		overlay?: Snippet;
	}

	let { level, stimulus, width, height, overlay }: Props = $props();

	// Same context contract as the stimulus-export stage: its presence switches
	// task components into screenshot mode (no gaze registration, no dwell targets).
	const ctx = $state<ScreenshotModeContext>({
		viewport: { width, height },
		highlightTargets: false
	});
	setContext(SCREENSHOT_MODE_KEY, ctx);

	$effect.pre(() => {
		ctx.viewport.width = width;
		ctx.viewport.height = height;
	});

	let frameWidth = $state(0);
	let windowHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 1080);
	const fit = $derived(
		frameWidth > 0 ? Math.min(frameWidth / width, (windowHeight * 0.75) / height, 1) : 0
	);

	let captureNode = $state<HTMLElement | null>(null);

	export function getCaptureNode(): HTMLElement | null {
		return captureNode;
	}

	export function getFitScale(): number {
		return fit;
	}

	// ── Pan & zoom ──
	const MAX_ZOOM = 8;
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let frameEl = $state<HTMLElement | null>(null);
	let panning = $state(false);
	let lastClient = { x: 0, y: 0 };

	const frameW = $derived(width * fit);
	const frameH = $derived(height * fit);

	function clampPan() {
		panX = Math.min(0, Math.max(frameW * (1 - zoom), panX));
		panY = Math.min(0, Math.max(frameH * (1 - zoom), panY));
	}

	function resetView() {
		zoom = 1;
		panX = 0;
		panY = 0;
	}

	$effect.pre(() => {
		void width;
		void height;
		resetView();
	});

	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		if (!frameEl) return;
		const rect = frameEl.getBoundingClientRect();
		const cx = event.clientX - rect.left;
		const cy = event.clientY - rect.top;
		const next = Math.min(MAX_ZOOM, Math.max(1, zoom * Math.exp(-event.deltaY * 0.0015)));
		const ratio = next / zoom;
		panX = cx - (cx - panX) * ratio;
		panY = cy - (cy - panY) * ratio;
		zoom = next;
		clampPan();
	}

	// Attached manually — Svelte's onwheel is passive, preventDefault would be ignored.
	$effect(() => {
		if (!frameEl) return;
		return on(frameEl, 'wheel', handleWheel, { passive: false });
	});

	function handlePointerDown(event: PointerEvent) {
		if (zoom <= 1) return;
		panning = true;
		lastClient = { x: event.clientX, y: event.clientY };
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!panning) return;
		panX += event.clientX - lastClient.x;
		panY += event.clientY - lastClient.y;
		lastClient = { x: event.clientX, y: event.clientY };
		clampPan();
	}

	function handlePointerUp() {
		panning = false;
	}

	const stimulusProps = $derived.by((): Record<string, unknown> | null => {
		if (!level || !stimulus) return null;
		const extra = stimulus.extraProps ?? {};
		if (level.kind === 'track' && stimulus.raw) {
			return { taskPreset: buildSingleStimulusPreset(level.levelId, stimulus.raw), ...extra };
		}
		return { ...extra };
	});
</script>

<svelte:window bind:innerHeight={windowHeight} />

<div class="w-full min-w-0 overflow-hidden" bind:clientWidth={frameWidth}>
	{#if fit === 0}
		<!-- One frame while the column width is measured -->
	{:else}
		<div
			bind:this={frameEl}
			class="relative overflow-hidden rounded-md border border-gray-200 bg-task-background {zoom > 1
				? panning
					? 'cursor-grabbing'
					: 'cursor-grab'
				: ''}"
			style="width: {frameW}px; height: {frameH}px; touch-action: none;"
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			onpointercancel={handlePointerUp}
		>
			<div
				style="transform: translate({panX}px, {panY}px) scale({fit *
					zoom}); transform-origin: top left;"
			>
				<div
					bind:this={captureNode}
					class="relative overflow-hidden"
					style="width: {width}px; height: {height}px;"
				>
					{#if level && stimulus && stimulusProps}
						{#key `${level.taskSlug}/${level.levelId}/${stimulus.id}`}
							<level.component {...stimulusProps} />
						{/key}
					{/if}
					{#if overlay}
						<div class="pointer-events-none absolute inset-0 z-10">
							{@render overlay()}
						</div>
					{/if}
				</div>
			</div>
			{#if zoom > 1}
				<button
					class="absolute top-2 right-2 z-20 cursor-pointer rounded bg-gray-800/70 px-2 py-0.5 text-xs text-white hover:bg-gray-800"
					title="Obnovit zobrazení"
					onclick={resetView}
				>
					{zoom.toFixed(1)}×
				</button>
			{/if}
		</div>
	{/if}
</div>
