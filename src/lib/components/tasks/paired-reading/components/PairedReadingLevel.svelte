<script lang="ts">
	import DwellTarget from '$lib/components/common/dwellTarget/DwellTarget.svelte';
	import DwellTargetArrow from '$lib/components/common/dwellTarget/DwellTargetArrow.svelte';
	import SymbolElement from '$lib/components/common/tracks/SymbolElement.svelte';
	import { canActivateSentenceWord } from '$lib/components/tasks/paired-reading';
	import { playPairedReadingAudio } from '$lib/components/tasks/paired-reading/paired-reading.audio';
	import PairedReadingSpeaker from '$lib/components/tasks/paired-reading/components/PairedReadingSpeaker.svelte';
	import { cursorVisible } from '$lib/stores/cursor';
	import { currentTask, taskStage } from '$lib/stores/task';
	import { AvaiableTracker, trackerConfig } from '$lib/stores/tracker';
	import {
		ANALYTICS_MANAGER_KEY,
		DwellState,
		KEYBOARD_MANAGER_KEY
	} from '$lib/types/general.types';
	import {
		TaskResult,
		TaskStage,
		TrackSlideStage,
		type TrackTaskDataEntry
	} from '$lib/types/task.types';
	import type { AnalyticsManager } from '$lib/utils/analyticsManager';
	import type { KeyboardManager } from '$lib/utils/keyboardManager';
	import { fade } from 'svelte/transition';
	import { getContext, onDestroy, onMount } from 'svelte';

	interface Props {
		id: string;
		data: TrackTaskDataEntry[];
		isPractice?: boolean;
		variant?: 'word' | 'sentence';
	}

	let { id, data, isPractice = false, variant = 'word' }: Props = $props();

	const analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);
	const keyboardManager = getContext<KeyboardManager>(KEYBOARD_MANAGER_KEY);

	let currentStage = $state(TrackSlideStage.InitialDwell);
	let currentRepetition = $state(0);
	let wordDwellState = $state(DwellState.Active);
	let speakerDwellState = $state(DwellState.Disabled);
	let arrowDwellState = $state(DwellState.Disabled);
	let speakerVisible = $state(true);
	let speakerReady = $state(false);
	let activeSentenceWordIndex = $state(-1);
	let sentenceWordDwellStates = $state<DwellState[]>([]);
	let audioPlaying = $state(false);
	let destroyed = false;

	const currentData = $derived(data[currentRepetition]);
	const currentWords = $derived(
		!currentData
			? []
			: Array.isArray(currentData.sequence[0])
				? (currentData.sequence as string[][]).flat()
				: (currentData.sequence as string[])
	);
	const currentText = $derived(String(currentData?.sound ?? currentWords.join(' ')));

	$effect(() => {
		currentTask.update((task) => {
			if (!task || !currentData) return task;
			return {
				...task,
				stimulusId: currentData.id,
				currentSlideIndex: currentRepetition + 1
			};
		});
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

	onMount(() => {
		const skipEvent = keyboardManager.onKeyDown('Enter', handleEnter, {
			preventDefault: true,
			ignoreRepeat: true
		});

		return () => {
			skipEvent.dispose();
		};
	});

	onDestroy(() => {
		destroyed = true;
		cursorVisible.set(true);
		if (audioPlaying) {
			window.speechSynthesis?.cancel();
		}
	});

	const showWord = () => {
		currentStage = TrackSlideStage.Task;
		if (variant === 'sentence') {
			updateSentenceWordDwellStates();
		}
	};

	const unlockSpeaker = () => {
		speakerReady = true;
		speakerDwellState = DwellState.Active;
	};

	const activateSentenceWord = (wordIndex: number) => {
		if (!canActivateSentenceWord(wordIndex, activeSentenceWordIndex, currentWords.length)) {
			return;
		}

		activeSentenceWordIndex = wordIndex;
		updateSentenceWordDwellStates();

		if (wordIndex === currentWords.length - 1) {
			unlockSpeaker();
		}
	};

	const updateSentenceWordDwellStates = () => {
		sentenceWordDwellStates = currentWords.map((_, wordIndex) =>
			canActivateSentenceWord(wordIndex, activeSentenceWordIndex, currentWords.length)
				? DwellState.Active
				: DwellState.Disabled
		);
	};

	const playCurrentText = async () => {
		speakerVisible = false;
		sentenceWordDwellStates = currentWords.map(() => DwellState.Disabled);

		await playPairedReadingAudio({
			text: currentText,
			analyticsManager,
			onStart: () => {
				audioPlaying = true;
			},
			onComplete: () => {
				audioPlaying = false;

				if (!destroyed) {
					analyticsManager.logCompleteSlide(currentRepetition + 1);
					arrowDwellState = DwellState.Active;
				}
			}
		});
	};

	const handleEnter = () => {
		if (currentStage === TrackSlideStage.InitialDwell) {
			showWord();
			return;
		}

		if (arrowDwellState === DwellState.Active) {
			advanceSlide();
		}
	};

	const resetSlide = () => {
		currentStage = TrackSlideStage.InitialDwell;
		wordDwellState = DwellState.Active;
		speakerDwellState = DwellState.Disabled;
		arrowDwellState = DwellState.Disabled;
		speakerVisible = true;
		speakerReady = false;
		activeSentenceWordIndex = -1;
		sentenceWordDwellStates = [];
		audioPlaying = false;
	};

	const advanceSlide = () => {
		if (currentRepetition < data.length - 1) {
			currentRepetition += 1;
			resetSlide();
			return;
		}

		currentTask.update((task) => {
			if (!task) return task;
			return { ...task, result: TaskResult.Natural };
		});
		taskStage.set(isPractice ? TaskStage.Instructions : TaskStage.End);
	};
</script>

<div class="flex h-screen w-full items-center justify-center bg-task-background">
	{#if currentStage === TrackSlideStage.InitialDwell}
		<div class="fixed top-16 left-16" transition:fade>
			<DwellTarget
				id={`${id}-slide-${currentRepetition + 1}-initial`}
				dwellTimeMs={300}
				bufferSize={50}
				width={125}
				onDwellComplete={showWord}
			/>
		</div>
	{:else}
		{#key currentRepetition}
			{#if variant === 'word'}
				<div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" transition:fade>
					<DwellTarget
						id={`${id}-slide-${currentRepetition + 1}-word`}
						dwellTimeMs={300}
						bufferSize={15}
						bind:dwellState={wordDwellState}
						onDwellComplete={unlockSpeaker}
					>
						<div class="flex h-full w-full items-center justify-center">
							<SymbolElement symbol={currentText} interactable={false} fontSize="2rem" />
						</div>
					</DwellTarget>
				</div>
			{:else}
				<div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" transition:fade>
					<div class="flex items-center justify-center gap-2" aria-label={currentText}>
						{#each currentWords as word, wordIndex (`${word}-${wordIndex}`)}
							<DwellTarget
								id={`${id}-slide-${currentRepetition + 1}-word-${wordIndex + 1}`}
								dwellTimeMs={50}
								bufferSize={10}
								fitWidthToContent
								height={48}
								bind:dwellState={sentenceWordDwellStates[wordIndex]}
								onDwellComplete={() => activateSentenceWord(wordIndex)}
							>
								<div
									class={`inline-flex h-full w-auto items-center justify-center rounded-[0.4rem] px-1 font-serif text-[2rem] leading-[1.2] text-gray-800 transition-colors duration-150 ease-in-out ${
										activeSentenceWordIndex === wordIndex ? 'bg-[#b8bd79]' : 'bg-transparent'
									}`}
								>
									{word}
								</div>
							</DwellTarget>
						{/each}
					</div>
				</div>
			{/if}

			{#if speakerVisible}
				<div
					class="fixed top-[calc(50%+clamp(11rem,22vh,14rem))] left-1/2 -translate-x-1/2 -translate-y-1/2"
					out:fade={{ duration: 300 }}
				>
					<DwellTarget
						id={`${id}-slide-${currentRepetition + 1}-speaker`}
						dwellTimeMs={150}
						bufferSize={50}
						width={100}
						height={100}
						bind:dwellState={speakerDwellState}
						onDwellComplete={playCurrentText}
					>
						<PairedReadingSpeaker ready={speakerReady} />
					</DwellTarget>
				</div>
			{/if}

			<div class="fixed right-16 bottom-16" transition:fade>
				<DwellTarget
					id={`${id}-slide-${currentRepetition + 1}-end`}
					dwellTimeMs={1000}
					bufferSize={50}
					width={125}
					bind:dwellState={arrowDwellState}
					onDwellComplete={advanceSlide}
				>
					<DwellTargetArrow />
				</DwellTarget>
			</div>
		{/key}
	{/if}
</div>
