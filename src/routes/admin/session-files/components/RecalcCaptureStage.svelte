<script lang="ts">
	import { setContext } from 'svelte';
	import { SCREENSHOT_MODE_KEY, type ScreenshotModeContext } from '$lib/types/general.types';
	import { buildSingleStimulusPreset } from '$lib/utils/stimulusExport/registry';
	import type { ResolvedSlide } from '$lib/utils/sessionSim/taskResolver';

	interface Props {
		slide: ResolvedSlide | null;
		width: number;
		height: number;
	}

	let { slide, width, height }: Props = $props();

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

	let captureNode = $state<HTMLElement | null>(null);

	export function getCaptureNode(): HTMLElement | null {
		return captureNode;
	}

	const stimulusProps = $derived.by((): Record<string, unknown> | null => {
		if (!slide) return null;
		const extra = slide.stimulus.extraProps ?? {};
		if (slide.level.kind === 'track' && slide.stimulus.raw) {
			return {
				taskPreset: buildSingleStimulusPreset(slide.level.levelId, slide.stimulus.raw),
				...extra
			};
		}
		return { ...extra };
	});
</script>

<!-- Rendered at full recording size but translated offscreen; rects stay measurable -->
<div
	class="fixed top-0 left-0 overflow-hidden bg-task-background"
	style="width: {width}px; height: {height}px; transform: translateX(-200vw);"
	aria-hidden="true"
>
	<div
		bind:this={captureNode}
		class="relative overflow-hidden"
		style="width: {width}px; height: {height}px;"
	>
		{#if slide && stimulusProps}
			{#key `${slide.level.taskSlug}/${slide.level.levelId}/${slide.stimulus.id}`}
				<slide.level.component {...stimulusProps} />
			{/key}
		{/if}
	</div>
</div>
