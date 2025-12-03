<script lang="ts">
	import DwellTarget from '$lib/components/common/dwellTarget/DwellTarget.svelte';
	import { getContext, onDestroy, onMount } from 'svelte';
	import { cursorVisible } from '$lib/stores/cursor';
	import { fade } from 'svelte/transition';
	import DwellTargetArrow from '$lib/components/common/dwellTarget/DwellTargetArrow.svelte';
	import type { KeyboardManager } from '$lib/utils/keyboardManager';
	import { playSound, SOUND_MISTAKE } from '$lib/utils/sound';
	import { TrackLevelStage, type TrackTaskProps } from '$lib/types/task.types';

	let {
		id,
		data,
		isPractice = false,
		onCompleted = () => {},
		validateSymbol = () => false,
		validateStage = () => true,
		reportMistake = () => {},
		onSpace = () => {},
		trackComponent,
		hintComponent,
		extraComponent
	}: TrackTaskProps = $props();

	let currentStage = $state<TrackLevelStage>(TrackLevelStage.InitialDwell);
	let currentRepetition = $state<number>(0);

	// let lastSymbolIndex = $state<number | null>(null);
	let selectedIndices = $state<number[]>([]);
	let shouldShakeArrow = $state<boolean>(false);

	const repetitions = data.length;
	const currentData = $derived(() => data[currentRepetition % data.length]);
	const symbols = $derived(() => currentData().sequence);
	const currentState = $derived(() => ({
		selectedCorrectIndices: selectedIndices,
		dataEntry: currentData()
	}));

	let dwellArrowElement = $state<DwellTarget | null>(null);

	onMount(() => {
		let keyboardManager = getContext<KeyboardManager>('keyboardManager');

		const skipEvt = keyboardManager.onKeyDown('Enter', skipStage, { preventDefault: true, ignoreRepeat: true });
		const spaceEvt = keyboardManager.onKeyDown('Space', () => onSpace(currentState()), { preventDefault: true, stopPropagation: true, ignoreRepeat: true });

		return () => {
			skipEvt.dispose();
			spaceEvt.dispose();
		};
	})

	$effect(() => {
		if (currentStage === TrackLevelStage.InitialDwell) {
			cursorVisible.set(false);
		} else {
			cursorVisible.set(true);
		}
	});

	onDestroy(() => {
		cursorVisible.set(true);
	});

	function skipStage() {
		if (currentStage === TrackLevelStage.InitialDwell) {
			currentStage = TrackLevelStage.Task;
		} else if (currentStage === TrackLevelStage.Task) {
			advanceLevel();
		}
	}

	function advanceLevel() {
		if (currentRepetition < repetitions - 1) {
			currentRepetition += 1;
			currentStage = TrackLevelStage.InitialDwell;
			selectedIndices = [];
		} else {
			onCompleted();
		}
	}

	function validateSymbolClick(symbol: string, index: number): boolean {
		const validationResult = validateSymbol(index, currentState())
		if (validationResult) {
			selectedIndices = [...selectedIndices, index];
		}
		return validationResult;
	}

	function onAdvanceDwellComplete() {
		const validationResult = validateStage(currentState());
		if (validationResult === true) {
			console.log('Stage validation succeeded');
			advanceLevel();
		} else {
			console.log('Stage validation failed:', validationResult);
			reportMistake(validationResult)
			if (dwellArrowElement) {
				shouldShakeArrow = true;
				playSound(SOUND_MISTAKE, 0.33);
				setTimeout(() => {
					shouldShakeArrow = false;
				}, 500);
			}
		}
	}
</script>

<div class="flex h-screen w-full items-center justify-center bg-task-background">
	{#if currentStage === TrackLevelStage.InitialDwell}
		<div class="fixed top-16 left-16" id={`${id}_initial}`} transition:fade>
			<DwellTarget
				id={`${id}_initial}`}
			  dwellTimeMs={300}
			  bufferSize={50}
			  width={150}
			  onDwellComplete={() => {
					currentStage = TrackLevelStage.Task;
			  }}
			/>
		</div>
	{:else if currentStage === TrackLevelStage.Task}
		<div class="flex flex-col items-center justify-center gap-16">
			<div class="text-center">
				{#if hintComponent}
				<div class="flex items-start justify-center gap-32">
					<div in:fade|global={{ delay: 500 }} out:fade|global>
						{@render hintComponent({
							state: currentState(),
							isPractice
						})}
					</div>
					{#if trackComponent}
					<div class="flex items-center justify-center" in:fade|global={{ delay: 1500 }} out:fade|global>
						{@render trackComponent({
							symbols: symbols(),
							validateSymbolClick
						})}
					</div>
					{/if}
				</div>
				{:else}
					{#if trackComponent}
					<div class="flex items-center justify-center" in:fade|global={{ delay: 500 }} out:fade|global>
						{@render trackComponent({
							symbols: symbols(),
							validateSymbolClick
						})}
					</div>
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
			  id={`${id}_end}`}
			  dwellTimeMs={1000}
			  bufferSize={50}
			  width={150}
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

