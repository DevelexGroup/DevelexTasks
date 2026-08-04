<script lang="ts">
	import { getContext, onDestroy, onMount } from 'svelte';
	import DwellSymbol from './DwellSymbol.svelte';
	import {
		createInitialTargets,
		createReplacementTarget,
		type DwellSymbolLayout,
		type DwellSymbolTarget
	} from '../dwell-symbols';
	import { currentTask, taskStage } from '$lib/stores/task';
	import { TaskResult, TaskStage } from '$lib/types/task.types';
	import { cursorVisible } from '$lib/stores/cursor';
	import { AvaiableTracker, trackerConfig } from '$lib/stores/tracker';
	import { ANALYTICS_MANAGER_KEY } from '$lib/types/general.types';
	import type { AnalyticsManager } from '$lib/utils/analyticsManager';

	interface Props {
		isPractice?: boolean;
	}

	let { isPractice = false }: Props = $props();

	const analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);
	const runDurationMs = 30_000;
	const stimulusId = 'dwell-symbols-training';

	let viewportWidth = $state(1920);
	let viewportHeight = $state(1080);
	let targets = $state<DwellSymbolTarget[]>([]);
	let remainingMs = $state(runDurationMs);
	let mounted = $state(false);
	let completed = false;
	let timerFrame = 0;
	let runStartedAt = 0;
	let nextTargetId = 0;

	const layout = $derived(createLayout(viewportWidth, viewportHeight));
	const remainingSeconds = $derived(Math.ceil(remainingMs / 1000));

	$effect(() => {
		if (!mounted) return;
		targets = createInitialTargets(layout, createTargetId);
	});

	onMount(() => {
		viewportWidth = window.innerWidth;
		viewportHeight = window.innerHeight;
		mounted = true;
		runStartedAt = performance.now();
		timerFrame = requestAnimationFrame(updateTimer);

		if ($trackerConfig !== AvaiableTracker.MouseIdt) cursorVisible.set(false);

		if (!isPractice) {
			currentTask.update((task) =>
				task
					? {
							...task,
							currentSlideIndex: 1,
							stimulusId
						}
					: task
			);
			analyticsManager.logEvent('dwell-symbols-start');
		}
	});

	onDestroy(() => {
		mounted = false;
		cancelAnimationFrame(timerFrame);
		cursorVisible.set(true);
	});

	function createTargetId() {
		return `dwell-symbol-${nextTargetId++}`;
	}

	function replaceTarget(targetId: string) {
		if (completed) return;

		const targetIndex = targets.findIndex((target) => target.id === targetId);
		if (targetIndex === -1) return;

		const current = targets[targetIndex];
		const otherTargets = targets.filter((_, index) => index !== targetIndex);
		const replacement = createReplacementTarget(current, otherTargets, layout, createTargetId);
		targets = targets.map((target, index) => (index === targetIndex ? replacement : target));
	}

	function updateTimer(frameTime: number) {
		if (completed) return;

		remainingMs = Math.max(0, runDurationMs - (frameTime - runStartedAt));
		if (remainingMs === 0) {
			finishRun();
			return;
		}

		timerFrame = requestAnimationFrame(updateTimer);
	}

	function finishRun() {
		if (completed) return;

		completed = true;
		cancelAnimationFrame(timerFrame);
		cursorVisible.set(true);

		if (isPractice) {
			taskStage.set(TaskStage.Instructions);
			return;
		}

		analyticsManager.logEvent('complete-slide-1');
		currentTask.update((task) =>
			task
				? {
						...task,
						result: TaskResult.Natural
					}
				: task
		);
		taskStage.set(TaskStage.End);
	}

	function createLayout(width: number, height: number): DwellSymbolLayout {
		const padding = Math.max(16, Math.min(32, width * 0.025));
		const topInset = Math.max(82, Math.min(110, height * 0.12));
		const gap = Math.max(20, Math.min(40, Math.min(width, height) * 0.04));
		const availableTargetWidth = (width - padding * 2 - gap * 2) / 3;
		const availableTargetHeight = (height - topInset - padding - gap) / 2;
		const targetSize = Math.max(40, Math.min(170, availableTargetWidth, availableTargetHeight));

		return { width, height, targetSize, padding, topInset, gap };
	}
</script>

<svelte:window bind:innerWidth={viewportWidth} bind:innerHeight={viewportHeight} />

<div class="relative h-screen w-screen overflow-hidden bg-task-background">
	<div
		class="absolute top-[18px] left-1/2 z-10 flex min-w-28 -translate-x-1/2 flex-col items-center justify-center gap-px rounded-full border border-[#dbe2ea] bg-white/90 px-[18px] pt-[7px] pb-2 text-slate-700 shadow-[0_6px_20px_rgb(15_23_42/10%)]"
		aria-label={`${remainingSeconds} seconds remaining`}
	>
		<span class="text-2xl leading-[1.05] font-extrabold tabular-nums">{remainingSeconds}</span>
		<small class="text-xs leading-none font-bold tracking-[0.04em] uppercase">sekund</small>
	</div>

	{#each targets as target (target.id)}
		<div class="absolute top-0 left-0" style:transform={`translate(${target.x}px, ${target.y}px)`}>
			<DwellSymbol {target} size={layout.targetSize} onCompleted={() => replaceTarget(target.id)} />
		</div>
	{/each}
</div>
