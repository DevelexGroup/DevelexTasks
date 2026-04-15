<script lang="ts">
	import { browser } from '$app/environment';
	import { currentTask, remoteTestSessionId, taskStage, testSessionUploading, clientLogUploading } from '$lib/stores/task';
	import { TaskResult, TaskStage } from '$lib/types/task.types';
	import { getContext, onDestroy, untrack } from 'svelte';
	import { ANALYTICS_MANAGER_KEY } from '$lib/types/general.types';
	import type { AnalyticsManager } from '$lib/utils/analyticsManager';
	import {
		abortTestSession, addFilesToTestSessionPart,
		addTestSessionPart,
		completeTestSession,
		createTestSession
	} from '$lib/api/test-sessions';
	import { DatabaseExporter } from '$lib/utils/databaseExport';
	import { get } from 'svelte/store';
	import { authUser } from '$lib/stores/auth';
	import { clientLog } from '$lib/utils/clientLogger';
	import { formatTaskName } from '$lib/utils/taskMode';

	const FIRST_SLIDE_INDEX = 1;

	const analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);

	let previousSlideIndex = $state<number | undefined>(undefined);

	// Async coordination: serializes all session operations to prevent race conditions on slow machines.
	// Each operation (session/part creation, file upload, completion) chains onto this promise
	// so they execute sequentially regardless of how fast reactive updates fire.
	let operationChain: Promise<void> = Promise.resolve();
	// Tracks the in-flight part creation so handleSlideChange can await the correct part ID
	let currentPartCreationPromise: Promise<string | null> = Promise.resolve(null);

	// Task start
	$effect(() => {
		if ($taskStage === TaskStage.Task) {
			clientLog.start();
			analyticsManager.startLogging();
			const task = untrack(() => $currentTask);
			if (!task) {
				console.error('No current task found when trying to create test session.');
				clientLog.error('No current task found when trying to create test session.');
				return;
			}

			// Set previousSlideIndex so the slide change effect won't duplicate the first part
			previousSlideIndex = FIRST_SLIDE_INDEX;

			operationChain = createTestSession(formatTaskName(task.slug, task.level, task.mode))
				.then(async (session) => {
					console.log('Test session created:', session);
					clientLog.log('Test session created:', session);
					$remoteTestSessionId = session.id;
					await createSessionPartForSlide(session.id, FIRST_SLIDE_INDEX);
				})
				.catch((err) => {
					console.error('Failed to create test session:', err);
					clientLog.error('Failed to create test session:', err);
				});
		}
	});

	// Slide change — defined before task end effect so it chains first when both fire simultaneously
	$effect(() => {
		const slideIndex = $currentTask?.currentSlideIndex;
		const stage = $taskStage;
		if (slideIndex !== undefined && slideIndex >= 0 && (stage === TaskStage.Task || stage === TaskStage.End)) {
			const prevSlideIndex = untrack(() => previousSlideIndex);
			console.log(`Current slide: ${slideIndex}, Previous slide: ${prevSlideIndex}`);
			clientLog.log(`Current slide: ${slideIndex}, Previous slide: ${prevSlideIndex}`);

			const isEnd = stage === TaskStage.End;

			// Chain slide changes sequentially — each waits for the previous to complete
			operationChain = operationChain.then(() => {
				const currentRemoteTestSessionId = get(remoteTestSessionId);
				if (!currentRemoteTestSessionId) return;
				return handleSlideChange(currentRemoteTestSessionId, prevSlideIndex, isEnd ? 'end' : slideIndex);
			});

			previousSlideIndex = slideIndex;
		}
	});

	// Task end — defined after slide change effect so it waits for pending file uploads
	$effect(() => {
		if ($taskStage === TaskStage.End) {
			const result = untrack(() => $currentTask?.result);
			if (result) {
				if ($remoteTestSessionId) {
					$testSessionUploading = true;

					// Wait for all pending operations (including final file upload) before finalizing.
					// IMPORTANT: stopLogging is deferred into the chain so the polling timer stays alive
					// long enough for tickLogging to resolve any pending slide processing tokens.
					// Calling it synchronously here would kill the timer and cause waitForSlideProcessing
					// to hang indefinitely (the dyslex deadlock).
					operationChain = operationChain.then(async () => {
						analyticsManager.stopLogging(result);

						const sessionId = get(remoteTestSessionId);
						if (!sessionId) return;

						// Upload client logs to the last part
						const lastPartId = await currentPartCreationPromise;
						if (lastPartId) {
							$clientLogUploading = true;
							try {
								const logFile = clientLog.exportAsFile();
								await addFilesToTestSessionPart(sessionId, lastPartId, [logFile]);
								console.log('Client logs uploaded to last part.');
								clientLog.log('Client logs uploaded to last part.');
							} catch (err) {
								console.error('Failed to upload client logs:', err);
								clientLog.error('Failed to upload client logs:', err);
							} finally {
								$clientLogUploading = false;
							}
						}

						if (result === TaskResult.Natural) {
							await completeTestSession(sessionId);
							console.log('Test session completed successfully on task end.');
							clientLog.log('Test session completed successfully on task end.');
							$remoteTestSessionId = null;
						} else {
							await abortTestSession(sessionId);
							console.log('Test session aborted on task end.');
							clientLog.log('Test session aborted on task end.');
							$remoteTestSessionId = null;
						}
					}).catch((err) => {
						console.error('Failed to finalize test session on task end:', err);
						clientLog.error('Failed to finalize test session on task end:', err);
					}).finally(() => {
						clientLog.stop();
						$testSessionUploading = false;
					});
				} else {
					analyticsManager.stopLogging(result);
					clientLog.stop();
				}
			}
		}
	});

	const getFilesForSlide = async (slideIndex: number): Promise<File[]> => {
		const sessionId = $currentTask?.sessionId ?? undefined;
		const childId = get(authUser)?.username ?? undefined;
		if (!sessionId || !childId) {
			console.error('Missing sessionId or childId for getting files for slide.');
			clientLog.error('Missing sessionId or childId for getting files for slide.');
			return [];
		}
		// Get from databaseExport
		return await DatabaseExporter.exportToFiles({
			mode: 'session',
			sessionId,
			childId,
			slideIndex: slideIndex
		})
	}

	const uploadFilesForSlide = async (currentRemoteTestSessionId: string, partId: string, slideIndex: number) => {
		await analyticsManager.waitForSlideProcessing(slideIndex);
		const testFiles = await getFilesForSlide(slideIndex);
		await addFilesToTestSessionPart(currentRemoteTestSessionId, partId, testFiles);
		console.log(`Logged file for slide ${slideIndex} to test session.`);
		clientLog.log(`Logged file for slide ${slideIndex} to test session.`);
	}

	const createSessionPartForSlide = (currentRemoteTestSessionId: string, slideIndex: number): Promise<string | null> => {
		const promise = addTestSessionPart(currentRemoteTestSessionId, slideIndex)
			.then((testSessionPart) => {
				console.log(`Logged slide ${slideIndex} to test session:`, testSessionPart);
				clientLog.log(`Logged slide ${slideIndex} to test session:`, testSessionPart);
				return testSessionPart.id;
			})
			.catch((err) => {
				console.error(`Failed to log slide ${slideIndex} to test session:`, err);
				clientLog.error(`Failed to log slide ${slideIndex} to test session:`, err);
				return null;
			});
		currentPartCreationPromise = promise;
		return promise;
	}

	const handleSlideChange = async (currentRemoteTestSessionId: string, previousSlideIndex: number | undefined, slideIndex: number | 'end') => {
		if (slideIndex === previousSlideIndex) {
			return;
		}
		if (previousSlideIndex !== undefined) {
			// Await the part creation promise to get the correct part ID,
			// even if addTestSessionPart hasn't resolved yet on slow machines
			const partId = await currentPartCreationPromise;
			if (partId) {
				console.log(`Processing slide change from ${previousSlideIndex} to ${slideIndex}. Logging file for previous slide.`);
				clientLog.log(`Processing slide change from ${previousSlideIndex} to ${slideIndex}. Logging file for previous slide.`);
				await uploadFilesForSlide(currentRemoteTestSessionId, partId, previousSlideIndex);
			}
		}

		// If not end, then add new session part for the new slide
		if (slideIndex !== 'end') {
			await createSessionPartForSlide(currentRemoteTestSessionId, slideIndex);
		}
	}

	onDestroy(() => {
		if (!browser) return;

		clientLog.stop();
		analyticsManager.stopLogging(TaskResult.Terminate);
		if ($remoteTestSessionId) {
			abortTestSession($remoteTestSessionId)
				.then(() => {
					console.log('Test session aborted successfully.');
					clientLog.log('Test session aborted successfully.');
					$remoteTestSessionId = null;
				})
				.catch((err) => {
					console.error('Failed to abort test session:', err);
					clientLog.error('Failed to abort test session:', err);
				});
		}
	});
</script>
