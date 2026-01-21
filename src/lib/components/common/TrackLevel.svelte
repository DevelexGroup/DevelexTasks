<script lang="ts">
	import DwellTarget from '$lib/components/common/dwellTarget/DwellTarget.svelte';
	import { getContext, onDestroy, onMount } from 'svelte';
	import { cursorVisible } from '$lib/stores/cursor';
	import { fade } from 'svelte/transition';
	import DwellTargetArrow from '$lib/components/common/dwellTarget/DwellTargetArrow.svelte';
	import type { KeyboardManager } from '$lib/utils/keyboardManager';
	import { playSound, SOUND_CORRECT, SOUND_MISTAKE } from '$lib/utils/sound';
	import { TaskResult, TrackLevelStage, type TrackTaskProps } from '$lib/types/task.types';
	import { ANALYTICS_MANAGER_KEY, KEYBOARD_MANAGER_KEY } from '$lib/types/general.types';
	import GazeArea from '$lib/components/common/GazeArea.svelte';
	import { AnalyticsManager } from '$lib/utils/analyticsManager';
	import { currentTask } from '$lib/stores/task';
	import { AvaiableTracker, trackerConfig } from '$lib/stores/tracker';
	import { showDialog } from '$lib/stores/dialog';

	let {
		id,
		data,
		isPractice = false,
		onCompleted = () => {},
		validateSymbol = () => true,
		validateStage = () => true,
		onStageAdvance = () => {},
		onSpace = () => {},
		playValidationSounds = true,
		trackComponent,
		hintComponent,
		extraComponent
	}: TrackTaskProps = $props();

	const MAX_MISTAKES_BEFORE_DIALOG = 5;

	let currentStage = $state<TrackLevelStage>(TrackLevelStage.InitialDwell);
	let currentRepetition = $state<number>(0);

	// let lastSymbolIndex = $state<number | null>(null);
	let selectedIndices = $state<number[]>([]);
	let shouldShakeArrow = $state<boolean>(false);

	let mistakeCount = $state<number>(0);


	const repetitions = data.length;
	const currentData = $derived(() => data[currentRepetition % data.length]);
	const symbols = $derived(() => currentData().sequence);
	const currentState = $derived(() => ({
		selectedCorrectIndices: selectedIndices,
		dataEntry: currentData()
	}));

	let dwellArrowElement = $state<DwellTarget | null>(null);

	const analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);

	onMount(() => {
		let keyboardManager = getContext<KeyboardManager>(KEYBOARD_MANAGER_KEY);

		const skipEvt = keyboardManager.onKeyDown('Enter', skipStage, { preventDefault: true, ignoreRepeat: true });
		const spaceEvt = keyboardManager.onKeyDown('Space', () => onSpace(currentState()), { preventDefault: true, stopPropagation: true, ignoreRepeat: true });

		return () => {
			skipEvt.dispose();
			spaceEvt.dispose();
		};
	})

	$effect(() => {
		if (currentStage === TrackLevelStage.InitialDwell && $trackerConfig !== AvaiableTracker.MouseIdt) {
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
					stimulusId: currentData().id ,
					currentRepetition: currentRepetition + 1
				};
			}
			return task;
		});
	});

	$effect(() => {
		if (!isPractice && mistakeCount >= MAX_MISTAKES_BEFORE_DIALOG){
			showDialog({
				title: 'Chceš pokračovat?',
				description: 'Zdá se, že máš potíže s touto částí úlohy. Chceš pokračovat nebo zkusit jinou úlohu?',
				options: [
					{ label: "Pokračovat", variant: 'secondary', callback: () => { mistakeCount = 0; }, closeOnClick: true },
					{ label: "Změnit úlohu", variant: 'destructive', callback: () => { abortTask(); }, closeOnClick: true }
				]
			});
		}
	})

	onDestroy(() => {
		cursorVisible.set(true);
	});

	function abortTask() {
		analyticsManager.stopLogging(TaskResult.Mistake);
		currentTask.update((task) => {
			if (task) {
				return {
					...task,
					result: TaskResult.Mistake
				};
			}
			return task;
		});
		onCompleted(TaskResult.Mistake);
	}

	function skipStage() {
		if (currentStage === TrackLevelStage.InitialDwell) {
			currentStage = TrackLevelStage.Task;
		} else if (currentStage === TrackLevelStage.Task) {
			advanceStage();
		}
	}

	function advanceStage() {
		if (currentRepetition < repetitions - 1) {
			currentRepetition += 1;
			currentStage = TrackLevelStage.InitialDwell;
			selectedIndices = [];
			onStageAdvance();
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

	function validateSymbolClick(symbol: string, index: number): boolean {
		const validationResult = validateSymbol(index, currentState())
		if (validationResult === true) {
			selectedIndices = [...selectedIndices, index];
			if (playValidationSounds)
				playSound(SOUND_CORRECT, 0.33);
			logWhenStageComplete();
			return true;
		}
		analyticsManager.logMistakeType(validationResult);
		if (playValidationSounds)
			playSound(SOUND_MISTAKE, 0.33);
		mistakeCount += 1;
		return false;
	}

	function onAdvanceDwellComplete() {
		const validationResult = validateStage(currentState());
		if (validationResult === true) {
			advanceStage();
		} else {
			analyticsManager.logMistakeType(validationResult)
			if (dwellArrowElement) {
				shouldShakeArrow = true;
				playSound(SOUND_MISTAKE, 0.33);
				setTimeout(() => {
					shouldShakeArrow = false;
				}, 500);
			}
		}
	}

	function logWhenStageComplete() {
		if (validateStage(currentState()) === true) {
			analyticsManager.logCompleteSlide(currentRepetition + 1);
		}
	}
</script>

<div class="flex h-screen w-full items-center justify-center bg-task-background">
	{#if currentStage === TrackLevelStage.InitialDwell}
		<div class="fixed top-16 left-16" id={`${id}_initial}`} transition:fade>
			<DwellTarget
				id={`slide-${currentRepetition + 1}_initial`}
			  dwellTimeMs={300}
			  bufferSize={50}
			  width={125}
			  onDwellComplete={() => {
					currentStage = TrackLevelStage.Task;
			  }}
			/>
		</div>
	{:else if currentStage === TrackLevelStage.Task}
		<div class="flex flex-col items-center justify-center gap-16">
			<div class="text-center">
				{#if hintComponent}
						<div class="flex justify-center gap-32">
							<GazeArea id="hint" bufferSize={50}>
								<div in:fade|global={{ delay: 500 }} out:fade|global>
									{@render hintComponent({
										state: currentState(),
										isPractice
									})}
								</div>
							</GazeArea>
							{#if trackComponent}
								<GazeArea id="track" bufferSize={50}>
									<div class="flex items-center justify-center" in:fade|global={{ delay: 800 }} out:fade|global>
										{@render trackComponent({
											symbols: symbols(),
											correctSymbols: currentData().correct,
											validateSymbolClick
										})}
									</div>
								</GazeArea>
							{/if}
						</div>
				{:else}
					{#if trackComponent}
						<GazeArea id="track" bufferSize={50}>
							<div class="flex items-center justify-center" in:fade|global={{ delay: 500 }} out:fade|global>
								{@render trackComponent({
									symbols: symbols(),
									correctSymbols: currentData().correct,
									validateSymbolClick
								})}
							</div>
						</GazeArea>
					{/if}
				{/if}
			</div>
			{#if extraComponent}
				<div in:fade|global={{ delay: 500 }} out:fade|global>
					{@render extraComponent({
						state: currentState(),
						isPractice
					})}
				</div>
			{/if}
		</div>
		<div class="fixed bottom-16 right-16" class:shake={shouldShakeArrow} id={`${id}_end}`} transition:fade>
			<DwellTarget
				bind:this={dwellArrowElement}
			  id={`slide-${currentRepetition + 1}_end`}
			  dwellTimeMs={1000}
			  bufferSize={50}
			  width={125}
			  onDwellComplete={onAdvanceDwellComplete}
			  disableOnComplete={false}
			>
				<DwellTargetArrow />
			</DwellTarget>
		</div>
	{/if}
</div>

<style>
	.shake {
		animation: shake 0.5s ease-in-out;
	}

	@keyframes shake {
		0%, 100% {
			transform: translateX(0);
		}
		20% {
			transform: translateX(-3px);
		}
		40% {
			transform: translateX(10px);
		}
		60% {
      transform: translateX(-10px);
    }
		80% {
			transform: translateX(3px);
		}
	}
</style>

