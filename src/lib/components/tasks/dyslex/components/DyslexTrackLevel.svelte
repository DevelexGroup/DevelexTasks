<script lang="ts">
	import DwellTarget from '$lib/components/common/dwellTarget/DwellTarget.svelte';
	import { getContext, onDestroy, onMount, type Snippet } from 'svelte';
	import { cursorVisible } from '$lib/stores/cursor';
	import { fade } from 'svelte/transition';
	import type { KeyboardManager } from '$lib/utils/keyboardManager';
	import { TaskResult, TrackSlideStage } from '$lib/types/task.types';
	import { KEYBOARD_MANAGER_KEY } from '$lib/types/general.types';
	import { currentTask } from '$lib/stores/task';
	import { AvaiableTracker, trackerConfig } from '$lib/stores/tracker';
	import DyslexFixCross from './DyslexFixCross.svelte';

	interface Props {
		id: string;
		children?: Snippet;
		repetitions: number;
		offset?: {
			x?: number;
			y?: number;
		};
		onCompleted?: (result: TaskResult) => void;
		onNextStage?: () => void;
		onSpace?: () => void;
	}

	let {
		id,
		repetitions,
		onCompleted = () => {},
		onSpace = () => {},
		onNextStage = () => {},
		children,
		offset = { x: 0, y: 0 }
	}: Props = $props();

	let currentStage = $state<TrackSlideStage>(TrackSlideStage.InitialDwell);
	let currentRepetition = $state<number>(0);

	$effect(() => {
		currentTask.update((task) => {
			if (task) {
				return { ...task, currentRepetition };
			}
			return task;
		});
	});

	onMount(() => {
		let keyboardManager = getContext<KeyboardManager>(KEYBOARD_MANAGER_KEY);

		const skipEvt = keyboardManager.onKeyDown('Enter', skipStage, {
			preventDefault: true,
			ignoreRepeat: true
		});
		const spaceEvt = keyboardManager.onKeyDown('Space', () => onSpace(), {
			preventDefault: true,
			stopPropagation: true,
			ignoreRepeat: true
		});

		return () => {
			skipEvt.dispose();
			spaceEvt.dispose();
		};
	});

	$effect(() => {
		if (
			currentStage === TrackSlideStage.InitialDwell &&
			$trackerConfig !== AvaiableTracker.MouseIdt
		) {
			cursorVisible.set(false);
		} else {
			cursorVisible.set(true);
		}
	});

	$effect(() => {
		currentTask.update((task) => {
			if (task) {
				return {
					...task,
					stimulusId: id,
					currentRepetition: currentRepetition + 1
				};
			}
			return task;
		});
	});

	onDestroy(() => {
		cursorVisible.set(true);
	});

	function skipStage() {
		if (currentStage === TrackSlideStage.InitialDwell) {
			currentStage = TrackSlideStage.Task;
		} else if (currentStage === TrackSlideStage.Task) {
			advanceStage();
		}
	}

	function advanceStage() {
		if (currentRepetition < repetitions - 1) {
			currentRepetition += 1;
			currentStage = TrackSlideStage.InitialDwell;
			onNextStage();
		} else {
			currentTask.update((task) => {
				if (task) {
					return {
						...task,
						result: TaskResult.Natural
					};
				}
				return task;
			});
			onCompleted(TaskResult.Natural);
		}
	}

	function onAdvanceDwellComplete() {
		advanceStage();
	}
</script>

<div
	class="flex h-screen w-full items-center justify-center bg-dyslex-task-background font-[Times_New_Roman] text-black"
>
	{#if currentStage === TrackSlideStage.InitialDwell}
		<div class="fixed top-16 left-16" id={`${id}_initial}`} transition:fade>
			<DwellTarget
				id={`slide-${currentRepetition + 1}_initial`}
				dwellTimeMs={300}
				bufferSize={50}
				width={125}
				onDwellComplete={() => {
					currentStage = TrackSlideStage.Task;
				}}
			/>
		</div>
	{:else if currentStage === TrackSlideStage.Task}
		<div
			class="flex flex-col items-center justify-center"
			style={`margin-top: ${offset.y}px; margin-left: ${offset.x}px;`}
		>
			<div in:fade|global={{ delay: 500 }} out:fade|global>
				{@render children?.()}
			</div>
		</div>

		<div class="fixed right-[254px] bottom-[149px]" id={`${id}_end}`} transition:fade>
			<DwellTarget
				id={`slide-${currentRepetition + 1}_end`}
				dwellTimeMs={1000}
				bufferSize={50}
				width={32}
				height={32}
				onDwellComplete={onAdvanceDwellComplete}
				disableOnComplete={false}
			>
				<DyslexFixCross />
			</DwellTarget>
		</div>
	{/if}
</div>
