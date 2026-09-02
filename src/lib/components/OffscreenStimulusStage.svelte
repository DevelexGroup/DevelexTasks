<script lang="ts">
	import { setContext, tick } from 'svelte';
	import { SCREENSHOT_MODE_KEY, type ScreenshotModeContext } from '$lib/types/general.types';
	import { buildSingleStimulusPreset } from '$lib/utils/stimulusExport/registry';
	import { settleStimulus } from '$lib/utils/stimulusExport/capture';
	import { captureAoiRects } from '$lib/utils/sessionSim/aoiCapture';
	import type { ResolvedSlide } from '$lib/utils/sessionSim/taskResolver';
	import type { AoiRect } from '$lib/utils/sessionSim/types';

	interface Viewport {
		width: number;
		height: number;
	}

	interface CaptureRequest {
		slide: ResolvedSlide;
		viewport: Viewport;
	}

	let request = $state<CaptureRequest | null>(null);
	let captureNode = $state<HTMLElement | null>(null);
	let queue: Promise<unknown> = Promise.resolve();

	// Same context contract as the stimulus-export stage: its presence switches
	// task components into screenshot mode (no gaze registration, no dwell targets).
	const ctx = $state<ScreenshotModeContext>({
		viewport: { width: 0, height: 0 },
		highlightTargets: false
	});
	setContext(SCREENSHOT_MODE_KEY, ctx);

	$effect.pre(() => {
		ctx.viewport.width = request?.viewport.width ?? 0;
		ctx.viewport.height = request?.viewport.height ?? 0;
	});

	async function waitForNode(): Promise<HTMLElement | null> {
		for (let i = 0; i < 120; i++) {
			if (captureNode) return captureNode;
			await new Promise(requestAnimationFrame);
		}
		return null;
	}

	async function captureNow(slide: ResolvedSlide, viewport: Viewport): Promise<AoiRect[]> {
		request = { slide, viewport };
		try {
			await tick();
			const node = await waitForNode();
			if (!node) throw new Error('Stimul se nepodařilo vykreslit');
			await settleStimulus(node);
			return captureAoiRects(node);
		} finally {
			request = null;
		}
	}

	/** Renders the stimulus offscreen at the recording viewport and reads its AOI rects; calls run one at a time. */
	export function capture(slide: ResolvedSlide, viewport: Viewport): Promise<AoiRect[]> {
		const run = queue.then(() => captureNow(slide, viewport));
		queue = run.catch(() => undefined);
		return run;
	}

	const stimulusProps = $derived.by((): Record<string, unknown> | null => {
		if (!request) return null;
		const { level, stimulus } = request.slide;
		const extra = stimulus.extraProps ?? {};
		if (level.kind === 'track' && stimulus.raw) {
			return { taskPreset: buildSingleStimulusPreset(level.levelId, stimulus.raw), ...extra };
		}
		return { ...extra };
	});
</script>

<!-- Rendered at full recording size but translated offscreen; rects stay measurable -->
{#if request && stimulusProps}
	{@const slide = request.slide}
	<div
		class="fixed top-0 left-0 overflow-hidden bg-task-background"
		style="width: {request.viewport.width}px; height: {request.viewport
			.height}px; transform: translateX(-200vw);"
		aria-hidden="true"
	>
		<div
			bind:this={captureNode}
			class="relative overflow-hidden"
			style="width: {request.viewport.width}px; height: {request.viewport.height}px;"
		>
			{#key `${slide.level.taskSlug}/${slide.level.levelId}/${slide.stimulus.id}`}
				<slide.level.component {...stimulusProps} />
			{/key}
		</div>
	</div>
{/if}
