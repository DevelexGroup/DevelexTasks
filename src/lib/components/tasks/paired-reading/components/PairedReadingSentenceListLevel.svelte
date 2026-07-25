<script lang="ts">
	import DwellTarget from '$lib/components/common/dwellTarget/DwellTarget.svelte';
	import DwellTargetArrow from '$lib/components/common/dwellTarget/DwellTargetArrow.svelte';
	import { canActivateSentenceWord, groupSentences } from '$lib/components/tasks/paired-reading';
	import PairedReadingSpeaker from '$lib/components/tasks/paired-reading/components/PairedReadingSpeaker.svelte';
	import { playPairedReadingAudio } from '$lib/components/tasks/paired-reading/paired-reading.audio';
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
		sentencesPerList?: number;
	}

	let { id, data, isPractice = false, sentencesPerList = 3 }: Props = $props();

	const analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);
	const keyboardManager = getContext<KeyboardManager>(KEYBOARD_MANAGER_KEY);

	const getWords = (sentence: TrackTaskDataEntry | undefined): string[] => {
		if (!sentence) return [];
		return Array.isArray(sentence.sequence[0])
			? (sentence.sequence as string[][]).flat()
			: (sentence.sequence as string[]);
	};

	const sentenceGroups = groupSentences(data, sentencesPerList);

	let currentStage = $state(TrackSlideStage.InitialDwell);
	let currentGroupIndex = $state(0);
	let currentSentenceIndex = $state(0);
	let activeWordIndex = $state(-1);
	let wordDwellStates = $state<DwellState[]>([]);
	let speakerDwellState = $state(DwellState.Disabled);
	let arrowDwellState = $state(DwellState.Disabled);
	let speakerReady = $state(false);
	let speakerVisible = $state(true);
	let audioPlaying = $state(false);
	let destroyed = false;

	const currentGroup = $derived(sentenceGroups[currentGroupIndex] ?? []);
	const currentSentenceData = $derived(currentGroup[currentSentenceIndex]);
	const currentWords = $derived(getWords(currentSentenceData));
	const currentSentenceText = $derived(
		String(currentSentenceData?.sound ?? currentWords.join(' '))
	);

	$effect(() => {
		currentTask.update((task) => {
			if (!task) return task;
			return {
				...task,
				stimulusId: currentGroup.map(({ id: sentenceId }) => sentenceId).join('+'),
				currentSlideIndex: currentGroupIndex + 1
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

	const showSentenceList = () => {
		currentStage = TrackSlideStage.Task;
		currentSentenceIndex = 0;
		resetCurrentSentence();
	};

	const resetCurrentSentence = () => {
		activeWordIndex = -1;
		speakerReady = false;
		speakerDwellState = DwellState.Disabled;
		wordDwellStates = currentWords.map((_, wordIndex) =>
			canActivateSentenceWord(wordIndex, activeWordIndex, currentWords.length)
				? DwellState.Active
				: DwellState.Disabled
		);
	};

	const activateWord = (wordIndex: number) => {
		if (!canActivateSentenceWord(wordIndex, activeWordIndex, currentWords.length)) {
			return;
		}

		activeWordIndex = wordIndex;
		wordDwellStates = currentWords.map((_, index) =>
			canActivateSentenceWord(index, activeWordIndex, currentWords.length)
				? DwellState.Active
				: DwellState.Disabled
		);

		if (wordIndex === currentWords.length - 1) {
			speakerReady = true;
			speakerDwellState = DwellState.Active;
		}
	};

	const playCurrentSentence = async () => {
		if (audioPlaying || !currentSentenceData) return;

		wordDwellStates = currentWords.map(() => DwellState.Disabled);

		await playPairedReadingAudio({
			text: currentSentenceText,
			analyticsManager,
			onStart: () => {
				audioPlaying = true;
			},
			onComplete: () => {
				audioPlaying = false;

				if (!destroyed) {
					advanceSentence();
				}
			}
		});
	};

	const advanceSentence = () => {
		if (currentSentenceIndex < currentGroup.length - 1) {
			currentSentenceIndex += 1;
			resetCurrentSentence();
			return;
		}

		speakerVisible = false;
		analyticsManager.logCompleteSlide(currentGroupIndex + 1);
		arrowDwellState = DwellState.Active;
	};

	const handleEnter = () => {
		if (currentStage === TrackSlideStage.InitialDwell) {
			showSentenceList();
			return;
		}

		if (arrowDwellState === DwellState.Active) {
			advanceGroup();
		}
	};

	const resetGroup = () => {
		currentStage = TrackSlideStage.InitialDwell;
		currentSentenceIndex = 0;
		activeWordIndex = -1;
		wordDwellStates = [];
		speakerDwellState = DwellState.Disabled;
		arrowDwellState = DwellState.Disabled;
		speakerReady = false;
		speakerVisible = true;
		audioPlaying = false;
	};

	const advanceGroup = () => {
		if (currentGroupIndex < sentenceGroups.length - 1) {
			currentGroupIndex += 1;
			resetGroup();
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
				id={`${id}-list-${currentGroupIndex + 1}-initial`}
				dwellTimeMs={300}
				bufferSize={50}
				width={125}
				onDwellComplete={showSentenceList}
			/>
		</div>
	{:else}
		{#key currentGroupIndex}
			<div
				class="fixed top-1/2 left-1/2 flex w-max -translate-x-1/2 -translate-y-1/2 flex-col gap-3"
				transition:fade
			>
				{#each currentGroup as sentence, sentenceIndex (sentence.id)}
					{@const sentenceWords = getWords(sentence)}
					<div class="flex h-25 w-fit items-center">
						<div
							class={`flex items-center gap-2 rounded-[0.4rem] px-1 py-0.5 transition-colors duration-200 ${
								sentenceIndex === currentSentenceIndex ? 'bg-[#b8bd79]' : 'bg-transparent'
							}`}
							aria-label={sentenceWords.join(' ')}
						>
							{#each sentenceWords as word, wordIndex (`${word}-${wordIndex}`)}
								{#if sentenceIndex === currentSentenceIndex}
									<DwellTarget
										id={`${id}-list-${currentGroupIndex + 1}-sentence-${sentenceIndex + 1}-word-${wordIndex + 1}`}
										dwellTimeMs={50}
										bufferSize={10}
										fitWidthToContent
										height={56}
										bind:dwellState={wordDwellStates[wordIndex]}
										onDwellComplete={() => activateWord(wordIndex)}
									>
										<span
											class="inline-flex h-14 w-auto items-center justify-center bg-transparent px-1 font-serif text-[2rem] leading-[1.2] text-gray-800"
										>
											{word}
										</span>
									</DwellTarget>
								{:else}
									<span
										class="inline-flex h-14 w-auto items-center justify-center bg-transparent px-1 font-serif text-[2rem] leading-[1.2] text-gray-800"
									>
										{word}
									</span>
								{/if}
							{/each}
						</div>
					</div>
				{/each}

				{#if speakerVisible}
					<div
						class="absolute left-[calc(100%+5rem)] h-25 w-25 transition-[top] duration-300 ease-in-out"
						style:top={`${currentSentenceIndex * 7}rem`}
						out:fade={{ duration: 300 }}
					>
						<DwellTarget
							id={`${id}-list-${currentGroupIndex + 1}-sentence-${currentSentenceIndex + 1}-speaker`}
							dwellTimeMs={150}
							bufferSize={50}
							width={100}
							height={100}
							bind:dwellState={speakerDwellState}
							onDwellComplete={playCurrentSentence}
						>
							<PairedReadingSpeaker ready={speakerReady} />
						</DwellTarget>
					</div>
				{/if}
			</div>

			<div class="fixed right-16 bottom-16" transition:fade>
				<DwellTarget
					id={`${id}-list-${currentGroupIndex + 1}-end`}
					dwellTimeMs={1000}
					bufferSize={50}
					width={125}
					bind:dwellState={arrowDwellState}
					onDwellComplete={advanceGroup}
				>
					<DwellTargetArrow />
				</DwellTarget>
			</div>
		{/key}
	{/if}
</div>
