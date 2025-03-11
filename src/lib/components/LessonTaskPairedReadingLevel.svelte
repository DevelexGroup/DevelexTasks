<script lang="ts">
	import { createEventDispatcher, getContext, onDestroy, onMount } from 'svelte';
	import { derived, get, writable } from 'svelte/store';
	import {
		PairedReadingIdManager,
		PairedReadingManager
	} from './LessonTaskPairedReadingLevel.utility';
	import LessonTaskPairedReadingLayout from './LessonTaskPairedReadingLayout.svelte';
	import type { LessonTaskPairedReadingTaskProps } from './LessonTaskPairedReadingLevel.type';
	import type { GazeManager, GazeInteractionObjectFixationEvent } from '@473783/develex-core';
	import { getCancellableAsync, waitForConditionCancellable } from '$lib/utils/waitForCondition';
	import { retry } from '$lib/utils/retry';

	let {
		currentContent,
		speechEvaluator,
		speechRecognition,
		wordReader,
		shouldListenForVoice,
		bufferSize,
		logicType = 'main',
		shouldEmitMistake = true,
		shouldHighlight = true
	}: LessonTaskPairedReadingTaskProps = $props();

	const dispatch = createEventDispatcher<{
		lessonSuccess: void;
		lessonMistake: void;
		lessonComplete: void;
		lessonFail: void;
	}>();

	shouldEmitMistake = false; // FORCE SETTING TO FALSE AS WE TRY POPUP DIRECTLY IN THE COMPONENT

	const gazeManager = getContext<GazeManager>('gazeManager');

	// State variables
	const hasFixatedStartCross = writable(false);
	const hasFixatedEndCross = writable(false);
	const currentlyReadingPhrase = writable<{ text: string; id: string } | null>(null);
	const hasFirstFixationInSegment = writable(false);
	let forceSuccess = false;
	const abortController = new AbortController();

	const pairedReadingManager = new PairedReadingManager(currentContent);
	const wordsStore = writable(pairedReadingManager.getWords());
	const gridStateStore = writable<'crossStart' | 'reading' | 'crossEnd'>('crossStart');

	const wordStore = derived(wordsStore, ($wordsStore) => $wordsStore);
	const showErrorPopup = writable(false);

	// Constants for evaluation
	const MIN_GAZE_POINTS = 1;
	const MIN_SUCCESS_FIXATIONS_PERCENTAGE = 50;
	const MAX_RETRY_ATTEMPTS = 3;
	const FIXCROSS_DELAY_AFTER_AUDIO = 150; // ms

	function evaluateReaderWordChange(phrase: { text: string; id: string } | null) {
		currentlyReadingPhrase.set(phrase);
	}

	let retryCount = 0;

	async function performSingleReadingSegment() {
		const segment = pairedReadingManager.getReadingSegment();
		gazeFixationCorrect = 0;
		gazeFixationMistake = 0;
		forceSuccess = false;
		retryCount = 0;
		hasFirstFixationInSegment.set(false);

		try {
			// Wait for first fixation in the segment
			await waitForConditionCancellable(hasFirstFixationInSegment, 100000, abortController.signal);

			while (retryCount < MAX_RETRY_ATTEMPTS) {
				let isFirstRun = true;
				try {
					// Reset counters for each attempt
					gazeFixationCorrect = isFirstRun ? 1 : 0; // At least one fixation is correct because we waited for it before starting the reading
					gazeFixationMistake = 0;

					await wordReader.read([segment]);

					// Add delay after audio finishes
					await new Promise((resolve) => setTimeout(resolve, FIXCROSS_DELAY_AFTER_AUDIO));

					const totalFixations = gazeFixationCorrect + gazeFixationMistake;
					const successPercentage =
						totalFixations > 0 ? (gazeFixationCorrect / totalFixations) * 100 : 0;

					if (totalFixations < MIN_GAZE_POINTS && !forceSuccess) {
						retryCount++;
						if (retryCount >= MAX_RETRY_ATTEMPTS) {
							showErrorPopup.set(true);
							throw new Error('Less than 10 gaze points after maximum retries');
						}
						throw new Error('Less than 10 gaze points');
					}

					if (successPercentage < MIN_SUCCESS_FIXATIONS_PERCENTAGE && !forceSuccess) {
						retryCount++;
						if (retryCount >= MAX_RETRY_ATTEMPTS) {
							showErrorPopup.set(true);
							throw new Error('Less than 50% of the fixations are correct after maximum retries');
						}
						throw new Error('Less than 50% of the fixations are correct');
					}

					// Success case, break out of the loop
					break;
				} catch (error) {
					// If we manually forced success, consider it a success
					if (forceSuccess) {
						break; // Success case
					}

					if (retryCount >= MAX_RETRY_ATTEMPTS) {
						showErrorPopup.set(true);
						throw error; // Re-throw after max retries
					}

					// Otherwise continue the loop for another retry
					wordReader.abort();
					if (shouldEmitMistake) {
						dispatch('lessonMistake');
					}

					// Wait before retry
					await new Promise((resolve) => setTimeout(resolve, shouldEmitMistake ? 5000 : 0));
				}
			}
		} catch (error) {
			if (abortController.signal.aborted) {
				throw error;
			}
			showErrorPopup.set(true);
			throw error;
		} finally {
			currentlyReadingPhrase.set(null);
		}
	}

	async function performReadingSegments() {
		for await (const segment of currentContent.evaluationSegment) {
			wordsStore.set(pairedReadingManager.getWords());
			void segment;
			try {
				await getCancellableAsync(performSingleReadingSegment, abortController.signal);
				pairedReadingManager.nextSegment();
				dispatch('lessonSuccess');
			} catch (error) {
				if (abortController.signal.aborted) {
					break;
				}
				// The error popup is already shown inside performSingleReadingSegment
				wordReader.abort();
				if (shouldEmitMistake) {
					dispatch('lessonMistake');
				}
			}
		}
	}

	// Handle fixation for cross A (start)
	function handleCrossAComplete() {
		hasFixatedStartCross.set(true);
	}

	// Handle fixation for cross B (end)
	function handleCrossBComplete() {
		hasFixatedEndCross.set(true);
	}

	async function performWaitForStartCrossFixation() {
		// Reset the fixation state before waiting
		hasFixatedStartCross.set(false);

		try {
			await waitForConditionCancellable(hasFixatedStartCross, 100000, abortController.signal);
			return true;
		} catch (error) {
			dispatch('lessonFail');
			return false;
		}
	}

	async function performWaitForEndCrossFixation() {
		// Reset the fixation state before waiting
		hasFixatedEndCross.set(false);

		try {
			await waitForConditionCancellable(hasFixatedEndCross, 100000, abortController.signal);
			dispatch('lessonComplete');
		} catch (error) {
			dispatch('lessonFail');
		}
	}

	async function performTask() {
		// Start with the start cross
		gridStateStore.set('crossStart');

		// Wait for start cross fixation
		const started = await performWaitForStartCrossFixation();
		if (!started) return;

		// Move to reading phase
		gridStateStore.set('reading');
		await performReadingSegments();

		// Move to end cross
		gridStateStore.set('crossEnd');
		await performWaitForEndCrossFixation();
	}

	function setupRegisterElement(element: HTMLElement) {
		gazeManager.register({
			interaction: 'fixation',
			element,
			settings: {
				bufferSize
			}
		});
	}

	function setupUnregisterElement(element: HTMLElement) {
		gazeManager.unregister({
			interaction: 'fixation',
			element
		});
	}

	// Add keyboard event handler
	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			const currentState = get(gridStateStore);

			if (currentState === 'crossStart') {
				hasFixatedStartCross.set(true);
			} else if (currentState === 'reading') {
				// Force success for current reading segment and ensure we skip any waiting states
				forceSuccess = true;
				hasFirstFixationInSegment.set(true);
				wordReader.abort();
				wordReader.onWordChange = () => {}; // Prevent any queued word changes
				currentlyReadingPhrase.set(null);
			} else if (currentState === 'crossEnd') {
				hasFixatedEndCross.set(true);
			}
		} else if (event.key === 'Escape') {
			// Ensure all reading stops immediately
			wordReader.abort();
			wordReader.onWordChange = () => {};
			currentlyReadingPhrase.set(null);
			dispatch('lessonFail');
		}
	}

	let gazeFixationCorrect = 0;
	let gazeFixationMistake = 0;

	function evaluateFixation(event: GazeInteractionObjectFixationEvent) {
		if (get(gridStateStore) !== 'reading') return;

		const phrase = get(currentlyReadingPhrase);
		const segment = pairedReadingManager.getReadingSegment();

		// Track fixation starts for activating fixcross
		if (event.type === 'fixationObjectStart') {
			// If we have a current phrase (reading has started), use its ID
			// Otherwise use the segment ID (before reading starts)
			const evaluationId = phrase?.id ?? segment.id;

			const isFixationCorrect = event.target.some((target) =>
				PairedReadingIdManager.isWordInEvaluationSegmentByIndex(
					evaluationId,
					target.id,
					currentContent
				)
			);

			if (isFixationCorrect) {
				gazeFixationCorrect++;
				// Only set first fixation if we haven't started reading yet
				if (!phrase) {
					hasFirstFixationInSegment.set(true);
				}
			} else {
				gazeFixationMistake++;
			}
		}
	}

	function closeErrorPopup() {
		showErrorPopup.set(false);
		dispatch('lessonFail');
	}

	onMount(() => {
		wordReader.onWordChange = evaluateReaderWordChange;
		performTask();
		gazeManager.on('fixationObjectStart', evaluateFixation);
		window.addEventListener('keydown', handleKeyPress);
	});

	onDestroy(() => {
		// Abort all ongoing async operations
		abortController.abort('Task destroyed');

		// Stop any ongoing word reading and prevent new ones
		wordReader.abort();
		wordReader.onWordChange = () => {}; // Empty function instead of null to satisfy TypeScript
		currentlyReadingPhrase.set(null);

		// Reset all state stores to prevent any lingering state
		hasFixatedStartCross.set(false);
		hasFixatedEndCross.set(false);
		hasFirstFixationInSegment.set(false);
		showErrorPopup.set(false);

		// Remove all event listeners
		gazeManager.off('fixationObjectStart', evaluateFixation);
		window.removeEventListener('keydown', handleKeyPress);

		// Reset counters
		gazeFixationCorrect = 0;
		gazeFixationMistake = 0;
	});
</script>

<LessonTaskPairedReadingLayout
	words={$wordStore}
	stage={$gridStateStore}
	wordsRegisterFn={setupRegisterElement}
	wordsUnregisterFn={setupUnregisterElement}
	{shouldHighlight}
	{gazeManager}
	onCrossAFixated={handleCrossAComplete}
	onCrossBFixated={handleCrossBComplete}
	dwellTimeMs={500}
/>

{#if $showErrorPopup}
	<div class="error-popup">
		<div class="error-popup-content">
			<h3>Pozor!</h3>
			<p>Nepodařilo se nám správně detekovat pozorování slov po několika pokusech.</p>
			<button on:click={closeErrorPopup}>OK</button>
		</div>
	</div>
{/if}

<style>
	.error-popup {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.error-popup-content {
		background-color: white;
		padding: 20px;
		border-radius: 8px;
		max-width: 400px;
		text-align: center;
	}

	.error-popup-content button {
		padding: 8px 16px;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		margin-top: 15px;
	}

	.error-popup-content button:hover {
		background-color: #0056b3;
	}
</style>
