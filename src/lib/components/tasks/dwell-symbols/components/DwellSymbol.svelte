<script lang="ts">
	import { getContext, onDestroy, onMount } from 'svelte';
	import type { GazeInteractionObjectIntersectEvent, GazeManager } from 'develex-js-sdk';
	import { ANALYTICS_MANAGER_KEY, GAZE_MANAGER_KEY } from '$lib/types/general.types';
	import type { AnalyticsManager } from '$lib/utils/analyticsManager';
	import { resolveAny } from '$lib/utils/resolveAny';
	import type { DwellSymbolTarget } from '../dwell-symbols';

	interface Props {
		target: DwellSymbolTarget;
		size: number;
		onCompleted: () => void;
	}

	let { target, size, onCompleted }: Props = $props();

	const gazeManager = getContext<GazeManager>(GAZE_MANAGER_KEY);
	const analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);
	const gazeBufferSize = 8;

	let element = $state<HTMLElement | null>(null);
	let progressMs = $state(0);
	let looking = $state(false);
	let successful = $state(false);
	let completed = false;
	let previousFrameTime = 0;
	let lastGazeEventTime = 0;
	let animationFrame = 0;
	let completionTimeout = 0;

	const progress = $derived(Math.min(progressMs / target.dwellTimeMs, 1));
	const progressColorClass = $derived(
		target.shape === 'cube'
			? 'stroke-blue-500'
			: target.shape === 'circle'
				? 'stroke-green-500'
				: 'stroke-purple-500'
	);
	const shapeClass = $derived(
		target.shape === 'cube'
			? 'h-[60%] w-[60%] rounded-[10%] bg-blue-100'
			: target.shape === 'circle'
				? 'h-[76%] w-[76%] rounded-full bg-green-100'
				: 'h-[76%] w-[76%] bg-purple-100 [clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0_50%)]'
	);

	onMount(() => {
		if (!element) return;

		gazeManager.register({
			interaction: 'fixation',
			element,
			settings: { bufferSize: gazeBufferSize }
		});
		gazeManager.register({
			interaction: 'intersect',
			element,
			settings: { bufferSize: gazeBufferSize }
		});
		gazeManager.on('intersect', handleIntersection);
		animationFrame = requestAnimationFrame(updateProgress);
	});

	onDestroy(() => {
		cancelAnimationFrame(animationFrame);
		clearTimeout(completionTimeout);
		gazeManager.off('intersect', handleIntersection);

		if (!element) return;
		gazeManager.unregister({ interaction: 'fixation', element });
		gazeManager.unregister({ interaction: 'intersect', element });
	});

	function handleIntersection(event: GazeInteractionObjectIntersectEvent) {
		if (!element || completed) return;

		lastGazeEventTime = performance.now();
		setLooking(
			event.gazeData.parseValidity !== false && event.target.some((target) => target === element)
		);
	}

	function setLooking(value: boolean) {
		if (looking === value) return;

		looking = value;
		if (looking) {
			analyticsManager.logEvent(`dwell-start_${target.id}`);
		} else if (progressMs > 0) {
			analyticsManager.logEvent(`dwell-cancel_${target.id}`);
		}
	}

	function updateProgress(frameTime: number) {
		if (completed) return;

		if (previousFrameTime === 0) previousFrameTime = frameTime;
		const elapsedMs = Math.min(frameTime - previousFrameTime, 100);
		previousFrameTime = frameTime;

		if (looking && frameTime - lastGazeEventTime > 200) setLooking(false);

		progressMs = Math.max(
			0,
			Math.min(target.dwellTimeMs, progressMs + elapsedMs * (looking ? 1 : -1))
		);

		if (progressMs >= target.dwellTimeMs) {
			completed = true;
			successful = true;
			analyticsManager.logEvent(`dwell-finish_${target.id}`);
			completionTimeout = window.setTimeout(onCompleted, 360);
			return;
		}

		animationFrame = requestAnimationFrame(updateProgress);
	}
</script>

<div
	bind:this={element}
	id={target.id}
	class="relative flex items-center justify-center transition-opacity duration-1000 ease-out select-none {successful
		? 'opacity-0'
		: ''}"
	style:width="{size}px"
	style:height="{size}px"
	aria-label={`${target.image.alt} in a ${target.shape}`}
>
	<svg
		class="absolute inset-0 h-full w-full -rotate-90 overflow-visible"
		viewBox="0 0 100 100"
		aria-hidden="true"
	>
		<circle class="fill-none stroke-[#d7dce5] stroke-5" cx="50" cy="50" r="46" pathLength="1" />
		<circle
			class="fill-none {progressColorClass} stroke-5 [stroke-linecap:round]"
			cx="50"
			cy="50"
			r="46"
			pathLength="1"
			stroke-dasharray="1"
			stroke-dashoffset={1 - progress}
		/>
	</svg>

	<div
		class="flex items-center justify-center shadow-[0_10px_24px_rgb(15_23_42/14%)] {shapeClass} {successful
			? 'brightness-[1.04] saturate-[1.15]'
			: ''}"
	>
		<img
			class="pointer-events-none h-[58%] w-[58%] object-contain"
			src={resolveAny(`/images/tasks/zrakovka/${target.image.name}.webp`)}
			alt={target.image.alt}
			draggable="false"
		/>
	</div>

	{#if successful}
		<div
			class="absolute flex aspect-square w-[36%] items-center justify-center rounded-full border-4 border-white bg-green-600 text-[clamp(1rem,3vw,2.25rem)] leading-none font-black text-white shadow-[0_6px_16px_rgb(22_163_74/30%)]"
			aria-hidden="true"
		>
			✓
		</div>
	{/if}
</div>
