<script lang="ts">
	import { setContext, type Snippet } from 'svelte';
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
			class="relative overflow-hidden rounded-md border border-gray-200 bg-task-background"
			style="width: {width * fit}px; height: {height * fit}px;"
		>
			<div style="transform: scale({fit}); transform-origin: top left;">
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
						<div class="absolute inset-0 z-10">
							{@render overlay()}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
