<script lang="ts">
	import { setContext } from 'svelte';
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
		highlightTargets: boolean;
	}

	let { level, stimulus, width, height, highlightTargets }: Props = $props();

	// Reactive context read by TrackLevel/DyslexTrackLevel/GazeArea/AudioHint/etc.
	// Its presence switches every task component into screenshot mode.
	const ctx = $state<ScreenshotModeContext>({
		viewport: { width, height },
		highlightTargets
	});
	setContext(SCREENSHOT_MODE_KEY, ctx);

	$effect.pre(() => {
		ctx.viewport.width = width;
		ctx.viewport.height = height;
		ctx.highlightTargets = highlightTargets;
	});

	let frameWidth = $state(0);
	let windowHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 1080);
	// Fit into the measured column width and ~70% of the viewport height, never upscale.
	// Rendering waits for the measurement so the full-size frame never blows out the layout.
	const fit = $derived(
		frameWidth > 0 ? Math.min(frameWidth / width, (windowHeight * 0.7) / height, 1) : 0
	);

	let captureNode = $state<HTMLElement | null>(null);

	export function getCaptureNode(): HTMLElement | null {
		return captureNode;
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
	{:else if level && stimulus && stimulusProps}
		<div
			class="relative overflow-hidden rounded-md border border-gray-200"
			style="width: {width * fit}px; height: {height * fit}px;"
		>
			<div style="transform: scale({fit}); transform-origin: top left;">
				<div
					bind:this={captureNode}
					class="relative overflow-hidden"
					style="width: {width}px; height: {height}px;"
				>
					{#key `${level.taskSlug}/${level.levelId}/${stimulus.id}`}
						<level.component {...stimulusProps} />
					{/key}
				</div>
			</div>
		</div>
	{:else}
		<div
			class="flex items-center justify-center rounded-md border border-dashed border-gray-300 text-sm text-gray-400"
			style="width: {width * fit}px; height: {height * fit}px;"
		>
			Vyberte stimul pro náhled
		</div>
	{/if}
</div>
