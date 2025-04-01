<script lang="ts">
	import { createEventDispatcher, getContext, onDestroy, onMount } from 'svelte';
	import {
		PairedReadingIdManager,
		PairedReadingManager
	} from './LessonTaskPairedReadingLevel.utility';
	import LessonTaskPairedReadingLayout from './LessonTaskPairedReadingLayout.svelte';
	import type { LessonTaskPairedReadingTaskProps } from './LessonTaskPairedReadingLevel.type';
	import type { GazeManager, GazeInteractionObjectFixationEvent } from '@473783/develex-core';
	import { createMachine, createActor, assign, fromPromise, interpret } from 'xstate';
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
	export const pairedReadingInnerTaskMachine = createMachine({
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
					actions: assign({
						correctFixations: 0,
						incorrectFixations: 0
					}),
					target: 'ReadingSegment'
				}
			},
			ReadingSegment: {
				invoke: {
					id: 'readingWord',
					src: fromPromise(async () => {
						const segment = pairedReadingManager.getReadingSegment();
						await wordReader.read([segment]);
						return 'word read';
					}),
					onDone: {
						target: 'AfterReadingBufferSegment'
					},
					onError: {
						actions: assign({
							failExplanation: 'Failed to read word (Technical error)'
						}),
						target: 'IntermediateFail'
					}
				},
				on: {
					forceSuccess: 'CompletedEvaluatedSegment',
					correctFixation: {
						actions: assign({
							correctFixations: ({ context }) => context.correctFixations + 1
						})
					},
					incorrectFixation: {
						actions: assign({
							incorrectFixations: ({ context }) => context.incorrectFixations + 1
						})
					}
				}
			},
			AfterReadingBufferSegment: {
				on: {
					forceSuccess: 'CompletedEvaluatedSegment',
					correctFixation: {
						actions: assign({
							correctFixations: ({ context }) => context.correctFixations + 1
						})
					},
					incorrectFixation: {
						actions: assign({
							incorrectFixations: ({ context }) => context.incorrectFixations + 1
						})
					}
				},
				after: {
					300: 'EvaluatingSuccessOfSegment'
				}
			},
			EvaluatingSuccessOfSegment: {
				always: [
					{
						guard: ({ context }) => context.correctFixations > context.incorrectFixations,
						target: 'CompletedEvaluatedSegment'
					},
					{
						target: 'FailedEvaluatedSegment'
					}
				],
				exit: () => {
					wordReader.abort();
				}
			},
			CompletedEvaluatedSegment: {
				always: [
					{
						guard: ({}) => pairedReadingManager.hasMoreSegments(),
						actions: [
							assign({
								retries: 0,
								correctFixations: 0,
								incorrectFixations: 0
							}),
							() => {
								pairedReadingManager.nextSegment();
								wordsStore = pairedReadingManager.getWords();
								wordReader.abort();
							}
						],
						target: 'WaitForFixation'
					},
					{
						target: 'CrossBPending'
					}
				],
				exit: () => {
					wordReader.abort();
				}
			},
			FailedEvaluatedSegment: {
				always: [
					{
						guard: ({ context }) => context.retries >= 3,
						actions: assign({
							failExplanation: 'After 3 retries, the word was not fixated correctly'
						}),
						target: 'IntermediateFail'
					},
					{
						actions: assign({
							retries: ({ context }) => context.retries + 1
						}),
						target: 'SetupReadingSegment'
					}
				],
				exit: () => {
					wordReader.abort();
				}
			},
			CrossBPending: {
				on: {
					crossBFixated: 'Completed',
					forceSuccess: 'Completed'
				}
			},
			IntermediateFail: {
				on: { retry: 'WaitForFixation', forceCrash: 'Failed' },
				exit: assign({
					failExplanation: '',
					retries: 0
				})
			},
			Completed: {
				type: 'final',
				entry: () => {
					wordReader.abort();
				}
			},
			Failed: {
				type: 'final',
				entry: () => {
					wordReader.abort();
				}
			}
		},
		on: {
			forceCrash: '.Failed'
		},
		exit: () => {
			wordReader.abort();
		}
	});

	// Use useMachine with inspection option
	const { snapshot, send } = useMachine(pairedReadingInnerTaskMachine, {
		inspect: (inspectionEvent) => {
			const actorRefId = (inspectionEvent.actorRef as any).id;
			const rootId = inspectionEvent.rootId;
			if (inspectionEvent.type === '@xstate.snapshot' && actorRefId === rootId) {
				const context = (inspectionEvent.snapshot as any).context as object;
				const status = inspectionEvent.snapshot.status;
				const event = inspectionEvent.event.type;
				const sessionId = getContext<string>('sessionId');
				const timestamp = new Date().toISOString();

				// Store the XState event in IndexedDB
				const xstateEvent = xstateEventsRepository.createFromInspectionEvent(
					sessionId,
					event,
					status,
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
		console.log('currentState', currentState);
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

	// Constants for evaluation
	const MIN_GAZE_POINTS = 1;
	const MIN_SUCCESS_FIXATIONS_PERCENTAGE = 50;
	const MAX_RETRY_ATTEMPTS = 3;
	const FIXCROSS_DELAY_AFTER_AUDIO = 150; // ms

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
