<script lang="ts">
	import { getContext, onDestroy, onMount } from 'svelte';
	import DwellSymbol from './DwellSymbol.svelte';
	import DwellSymbolPreview from './DwellSymbolPreview.svelte';
	import DwellTarget from '$lib/components/common/dwellTarget/DwellTarget.svelte';
	import DwellTargetArrow from '$lib/components/common/dwellTarget/DwellTargetArrow.svelte';
	import {
		createCriterion,
		createInitialTargets,
		matchesCriterion,
		randomInteger,
		refreshTargets,
		type DwellSymbolCriterion,
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

	let viewportWidth = $state(1920);
	let viewportHeight = $state(1080);
	let targets = $state<DwellSymbolTarget[]>([]);
	let criterion = $state<DwellSymbolCriterion | null>(null);
	let roundStage = $state<'preview' | 'game'>('preview');
	let score = $state(0);
	let remainingMs = $state(runDurationMs);
	let mounted = $state(false);
	let completed = false;
	let timerFrame = 0;
	let runStartedAt = 0;
	let nextTargetId = 0;

	const layout = $derived(createLayout(viewportWidth, viewportHeight));
	const remainingSeconds = $derived(Math.ceil(remainingMs / 1000));

	$effect(() => {
		if (!mounted || !criterion) return;
		targets = createInitialTargets(layout, createTargetId, Math.random, criterion);
	});

	onMount(() => {
		viewportWidth = window.innerWidth;
		viewportHeight = window.innerHeight;
		criterion = createCriterion();
		mounted = true;

		if ($trackerConfig !== AvaiableTracker.MouseIdt) cursorVisible.set(false);

		currentTask.update((task) =>
			task
				? {
						...task,
						currentSlideIndex: 1,
						stimulusId: 'dwell-symbols-preview'
					}
				: task
		);
		if (!isPractice) analyticsManager.logEvent('dwell-symbols-preview');
	});

	onDestroy(() => {
		mounted = false;
		cancelAnimationFrame(timerFrame);
		cursorVisible.set(true);
	});

	function createTargetId() {
		return `dwell-symbol-${nextTargetId++}`;
	}

	function startGame() {
		if (roundStage === 'game' || !criterion) return;
		const currentCriterion = criterion;

		roundStage = 'game';
		remainingMs = runDurationMs;
		runStartedAt = performance.now();
		timerFrame = requestAnimationFrame(updateTimer);
		currentTask.update((task) =>
			task
				? {
						...task,
						currentSlideIndex: 2,
						stimulusId: `dwell-symbols-${currentCriterion.shape}-${currentCriterion.image.name}`
					}
				: task
		);
		if (!isPractice) {
			analyticsManager.logEvent('complete-slide-1');
			analyticsManager.logEvent('dwell-symbols-start');
		}
	}

	function handleTargetCompleted(target: DwellSymbolTarget) {
		if (completed || !criterion) return;

		const isCorrect = matchesCriterion(target, criterion);
		score += isCorrect ? 1 : -1;
		analyticsManager.logEvent(isCorrect ? 'dwell-symbols-correct' : 'dwell-symbols-incorrect');
		analyticsManager.logEvent(`dwell-symbols-score_${score}`);
		targets = refreshTargets(
			targets,
			target.id,
			isCorrect ? randomInteger(2, 4) : 1,
			criterion,
			layout,
			createTargetId
		);
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

		analyticsManager.logEvent(`dwell-symbols-final-score_${score}`);
		analyticsManager.logEvent('complete-slide-2');
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
	{#if roundStage === 'preview' && criterion}
		<div class="flex h-full w-full flex-col items-center justify-center gap-8">
			<p class="text-xl font-bold text-slate-700">Hledej tento symbol</p>
			<DwellSymbolPreview {criterion} size={Math.min(300, layout.targetSize * 1.65)} />
		</div>

		<div class="fixed right-16 bottom-16">
			<DwellTarget
				id="dwell-symbols-preview-next"
				dwellTimeMs={1000}
				bufferSize={50}
				width={125}
				onDwellComplete={startGame}
			>
				<DwellTargetArrow />
			</DwellTarget>
		</div>
	{:else if roundStage === 'game' && criterion}
		<div
			class="absolute top-[18px] left-1/2 z-10 flex min-w-28 -translate-x-1/2 flex-col items-center justify-center gap-px rounded-full border border-[#dbe2ea] bg-white/90 px-[18px] pt-[7px] pb-2 text-slate-700 shadow-[0_6px_20px_rgb(15_23_42/10%)]"
			aria-label={`${remainingSeconds} seconds remaining`}
		>
			<span class="text-2xl leading-[1.05] font-extrabold tabular-nums">{remainingSeconds}</span>
			<small class="text-xs leading-none font-bold tracking-[0.04em] uppercase">sekund</small>
		</div>

		<div
			class="absolute top-[18px] left-[18px] z-10 flex min-w-28 flex-col items-center justify-center gap-px rounded-full border border-[#dbe2ea] bg-white/90 px-[18px] pt-[7px] pb-2 text-slate-700 shadow-[0_6px_20px_rgb(15_23_42/10%)]"
			aria-label={`Score ${score}`}
		>
			<span class="text-2xl leading-[1.05] font-extrabold tabular-nums">{score}</span>
			<small class="text-xs leading-none font-bold tracking-[0.04em] uppercase">skóre</small>
		</div>

		{#each targets as target (target.id)}
			<div
				class="absolute top-0 left-0"
				style:transform={`translate(${target.x}px, ${target.y}px)`}
			>
				<DwellSymbol
					{target}
					size={layout.targetSize}
					isCorrect={matchesCriterion(target, criterion)}
					onCompleted={() => handleTargetCompleted(target)}
				/>
			</div>
		{/each}
	{/if}
</div>
