<script lang="ts">
	import { createEventDispatcher, getContext, onDestroy, onMount } from 'svelte';
	import {
		PairedReadingIdManager,
		PairedReadingManager
	} from './LessonTaskPairedReadingLevel.utility';
	import LessonTaskPairedReadingLayout from './LessonTaskPairedReadingLayout.svelte';
	import type { LessonTaskPairedReadingTaskProps } from './LessonTaskPairedReadingLevel.type';
	import type { GazeManager, GazeInteractionObjectFixationEvent } from '@473783/develex-core';
	import { assign, fromPromise, setup } from 'xstate';
	import { useMachine } from '@xstate/svelte';
	import xstateEventsRepository from '$lib/database/repositories/xstateEvents.repository';

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
		lessonComplete: {
			playRoundComplete: boolean;
		};
		lessonFail: void;
	}>();

	const sessionId = getContext<string>('sessionId');

	// Constants for evaluation
	// TODO: Use in the machine
	const MIN_GAZE_POINTS = 1;
	const MIN_SUCCESS_FIXATIONS_PERCENTAGE = 50;
	const MAX_RETRY_ATTEMPTS = 3;
	const DELAY_AFTER_AUDIO_CONSTANT = 150; // ms

	/**
	 * @description This is the machine that handles the paired reading task.
	 * It is used to handle the fixation events and the reading events.
	 * It is also used to handle the success and failure of the task.
	 * It is used to handle the retry of the task.
	 * It is used to handle the force success of the task.
	 * It is used to handle the force crash of the task.
	 *
	 * Check the xstate 5 documentation for more information:
	 * https://stately.ai/docs/xstate-5/
	 */
	export const pairedReadingInnerTaskMachine = setup({
		delays: {
			DELAY_AFTER_AUDIO: DELAY_AFTER_AUDIO_CONSTANT
		},
		actions: {
			resetFixations: assign({
				correctFixations: 0,
				incorrectFixations: 0
			}),
			resetRetries: assign({
				retries: 0
			}),
			resetFailExplanation: assign({
				failExplanation: ''
			}),
			pairedReadingManagerNextSegment: () => {
				pairedReadingManager.nextSegment();
				wordsStore = pairedReadingManager.getWords();
			},
			registerCorrectFixation: assign({
				correctFixations: ({ context }) => context.correctFixations + 1
			}),
			registerIncorrectFixation: assign({
				incorrectFixations: ({ context }) => context.incorrectFixations + 1
			}),
			registerRetry: assign({
				retries: ({ context }) => context.retries + 1
			}),
			setFailExplanationThreeRetries: assign({
				failExplanation: 'After 3 retries, the word was not fixated correctly'
			}),
			setFailExplanationTechnicalError: assign({
				failExplanation: 'Failed to read word (Technical error)'
			}),
			cancelAnyOngoingReading: () => {
				wordReader.abort();
			}
		},
		actors: {
			wordReader: fromPromise(async () => {
				const segment = pairedReadingManager.getReadingSegment();
				await wordReader.read([segment]);
				return 'word read';
			})
		},
		guards: {
			hasMoreSegments: ({ context }) => pairedReadingManager.hasMoreSegments(),
			hasTooManyRetries: ({ context }) => context.retries >= MAX_RETRY_ATTEMPTS,
			hasEnoughCorrectFixations: ({ context }) =>
				context.correctFixations > context.incorrectFixations
		}
	}).createMachine({
		id: 'pairedReadingInnerTask',
		initial: 'CrossAPending',
		context: {
			retries: 0,
			correctFixations: 0,
			incorrectFixations: 0,
			failExplanation: ''
		},
		states: {
			CrossAPending: {
				on: {
					crossAFixated: 'WaitForFixation',
					forceSuccess: 'WaitForFixation'
				}
			},
			WaitForFixation: {
				on: {
					correctFixation: 'SetupReadingSegment',
					forceSuccess: 'SetupReadingSegment'
				}
			},
			SetupReadingSegment: {
				always: {
					actions: 'resetFixations',
					target: 'ReadingSegment'
				}
			},
			ReadingSegment: {
				invoke: {
					id: 'readingWord',
					src: 'wordReader', // LINKS TO THE ACTOR KEY IN THE SETUP
					onDone: {
						target: 'AfterReadingBufferSegment'
					},
					onError: {
						actions: 'setFailExplanationTechnicalError',
						target: 'IntermediateFail'
					}
				},
				on: {
					forceSuccess: 'CompletedEvaluatedSegment',
					correctFixation: {
						actions: 'registerCorrectFixation'
					},
					incorrectFixation: {
						actions: 'registerIncorrectFixation'
					}
				}
			},
			AfterReadingBufferSegment: {
				on: {
					forceSuccess: 'CompletedEvaluatedSegment',
					correctFixation: {
						actions: 'registerCorrectFixation'
					},
					incorrectFixation: {
						actions: 'registerIncorrectFixation'
					}
				},
				after: {
					DELAY_AFTER_AUDIO: 'EvaluatingSuccessOfSegment'
				}
			},
			EvaluatingSuccessOfSegment: {
				always: [
					{
						guard: 'hasEnoughCorrectFixations',
						target: 'CompletedEvaluatedSegment'
					},
					{
						target: 'FailedEvaluatedSegment'
					}
				]
			},
			CompletedEvaluatedSegment: {
				always: [
					{
						guard: 'hasMoreSegments',
						actions: [
							'resetRetries',
							'resetFixations',
							'resetFailExplanation',
							'pairedReadingManagerNextSegment',
							'cancelAnyOngoingReading'
						],
						target: 'WaitForFixation'
					},
					{
						target: 'CrossBPending'
					}
				],
				exit: 'cancelAnyOngoingReading'
			},
			FailedEvaluatedSegment: {
				always: [
					{
						guard: 'hasTooManyRetries',
						actions: 'setFailExplanationThreeRetries',
						target: 'IntermediateFail'
					},
					{
						actions: 'registerRetry',
						target: 'SetupReadingSegment'
					}
				],
				exit: 'cancelAnyOngoingReading'
			},
			CrossBPending: {
				on: {
					crossBFixated: 'Completed',
					forceSuccess: 'Completed'
				}
			},
			IntermediateFail: {
				on: { retry: 'WaitForFixation', forceCrash: 'Failed' },
				exit: ['resetFailExplanation', 'resetRetries']
			},
			Completed: {
				type: 'final',
				entry: 'cancelAnyOngoingReading'
			},
			Failed: {
				type: 'final',
				entry: 'cancelAnyOngoingReading'
			}
		},
		on: {
			forceCrash: '.Failed'
		},
		exit: 'cancelAnyOngoingReading'
	});

	// Use useMachine with inspection option
	const { snapshot, send } = useMachine(pairedReadingInnerTaskMachine, {
		inspect: (inspectionEvent) => {
			const actorRefId = (inspectionEvent.actorRef as any).id;
			const rootId = inspectionEvent.rootId;
			if (inspectionEvent.type === '@xstate.snapshot' && actorRefId === rootId) {
				const context = (inspectionEvent.snapshot as any).context as object;
				// const status = (inspectionEvent.snapshot as any).status;
				const value = (inspectionEvent.snapshot as any).value;
				const event = inspectionEvent.event.type;
				const timestamp = new Date().toISOString();

				// Store the XState event in IndexedDB
				const xstateEvent = xstateEventsRepository.createFromInspectionEvent(
					sessionId,
					event,
					value,
					context,
					timestamp
				);

				xstateEventsRepository.create(xstateEvent).catch((error) => {
					console.error('Failed to store XState event:', error);
				});
			}
		}
	});

	const currentState = $derived.by(() => {
		return $snapshot.value;
	});
	const gridState = $derived.by(() => {
		if (typeof currentState === 'string') {
			if (currentState === 'CrossAPending') return 'crossStart';
			if (currentState === 'CrossBPending') return 'crossEnd';
			if (
				[
					'ReadingSegment',
					'WaitForFixation',
					'AfterReadingBufferSegment',
					'IntermediateFail',
					'FailedEvaluatedSegment',
					'CompletedEvaluatedSegment',
					'SetupReadingSegment'
				].includes(currentState)
			) {
				return 'reading';
			}
		}
		return 'reading'; // default
	});

	$effect(() => {
		if (currentState === 'CompletedEvaluatedSegment') {
			dispatch('lessonSuccess');
			alert('lessonSuccess');
		} else if (currentState === 'Failed') {
			dispatch('lessonFail');
		} else if (currentState === 'Completed') {
			dispatch('lessonComplete', {
				playRoundComplete: true
			});
		}
	});

	shouldEmitMistake = false; // FORCE SETTING TO FALSE AS WE TRY POPUP DIRECTLY IN THE COMPONENT

	const gazeManager = getContext<GazeManager>('gazeManager');

	const abortController = new AbortController();

	const pairedReadingManager = new PairedReadingManager(currentContent);
	let wordsStore = $state(pairedReadingManager.getWords());

	const showErrorPopup = $derived.by(() => {
		if (currentState === 'IntermediateFail') return true;
		return false;
	});

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
			send({ type: 'forceSuccess' });
		} else if (event.key === 'Escape') {
			send({ type: 'forceCrash' });
		}
	}

	function evaluateFixation(event: GazeInteractionObjectFixationEvent) {
		if (gridState !== 'reading') return;
		const segment = pairedReadingManager.getReadingSegment();
		// here check the state, only during reading segment

		// Track fixation starts for activating fixcross
		if (event.type === 'fixationObjectStart') {
			// If we have a current phrase (reading has started), use its ID
			// Otherwise use the segment ID (before reading starts)
			const evaluationId = segment.id;

			const isFixationCorrect = event.target.some((target) =>
				PairedReadingIdManager.isWordInEvaluationSegmentByIndex(
					evaluationId,
					target.id,
					currentContent
				)
			);

			if (isFixationCorrect) {
				send({ type: 'correctFixation' });
			} else {
				send({ type: 'incorrectFixation' });
			}
		}
	}

	function closeErrorPopup() {
		send({ type: 'retry' });
	}

	onMount(() => {
		gazeManager.on('fixationObjectStart', evaluateFixation);
		window.addEventListener('keydown', handleKeyPress);
	});

	onDestroy(() => {
		// Abort all ongoing async operations
		abortController.abort('Task destroyed');
		// Remove all event listeners
		gazeManager.off('fixationObjectStart', evaluateFixation);
		window.removeEventListener('keydown', handleKeyPress);
	});
</script>

<LessonTaskPairedReadingLayout
	words={wordsStore}
	stage={gridState}
	wordsRegisterFn={setupRegisterElement}
	wordsUnregisterFn={setupUnregisterElement}
	{shouldHighlight}
	{gazeManager}
	onCrossAFixated={() => send({ type: 'crossAFixated' })}
	onCrossBFixated={() => send({ type: 'crossBFixated' })}
	dwellTimeMs={500}
/>

<div class="absolute bottom-0 left-0 right-0">
	{currentState}
	{JSON.stringify($snapshot.context)}
</div>

{#if showErrorPopup}
	<div class="error-popup">
		<div class="error-popup-content">
			<h3>Pozor!</h3>
			<p>Nepodařilo se nám správně detekovat pozorování slov po několika pokusech.</p>
			<button onclick={closeErrorPopup}>Zkusit segment znovu</button>
			<button onclick={() => send({ type: 'forceCrash' })}>Jít zpět</button>
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
