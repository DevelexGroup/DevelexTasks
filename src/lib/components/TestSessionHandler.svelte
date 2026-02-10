<script lang="ts">
	import { browser } from '$app/environment';
	import { currentTask, remoteTestSessionId, taskStage } from '$lib/stores/task';
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

	const FIRST_SLIDE_INDEX = 1;

	const analyticsManager = getContext<AnalyticsManager>(ANALYTICS_MANAGER_KEY);

	let currentSessionPartId = $state<string | null>(null);
	let previousSlideIndex = $state<number | undefined>(undefined);

	// Task start
	$effect(() => {
		if ($taskStage === TaskStage.Task) {
			analyticsManager.startLogging();
			const task = untrack(() => $currentTask);
			if (!task) {
				console.error('No current task found when trying to create test session.');
				return;
			}
			createTestSession(`${task.slug}-${task.level}`)
				.then((session) => {
					console.log('Test session created:', session);
					$remoteTestSessionId = session.id;
					createSessionPartForSlide(session.id, FIRST_SLIDE_INDEX);
				})
				.catch((err) => {
					console.error('Failed to create test session:', err);
				});
		}
	});

	// Task end
	$effect(() => {
		if ($taskStage === TaskStage.End) {
			const result = untrack(() => $currentTask?.result);
			if (result) {
				analyticsManager.stopLogging(result);

				if ($remoteTestSessionId) {
					if (result === TaskResult.Natural) {
						completeTestSession($remoteTestSessionId)
							.then(() => {
								console.log('Test session completed successfully on task end.');
								$remoteTestSessionId = null;
							})
							.catch((err) => {
								console.error('Failed to complete test session on task end:', err);
							});
					} else {
						abortTestSession($remoteTestSessionId)
							.then(() => {
								console.log('Test session aborted on task end.');
								$remoteTestSessionId = null;
							})
							.catch((err) => {
								console.error('Failed to abort test session on task end:', err);
							});
					}
				}
			}
		}
	});

	const getFilesForSlide = async (slideIndex: number): Promise<File[]> => {
		const sessionId = $currentTask?.sessionId ?? undefined;
		const childId = get(authUser)?.username ?? undefined;
		if (!sessionId || !childId) {
			console.error('Missing sessionId or childId for getting files for slide.');
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

	const uploadFilesForSlide = async (currentRemoteTestSessionId: string, currentSessionPartIdAtChange: string, slideIndex: number) => {
		await analyticsManager.waitForSlideProcessing(slideIndex);
		const testFiles = await getFilesForSlide(slideIndex);
		await addFilesToTestSessionPart(currentRemoteTestSessionId, currentSessionPartIdAtChange, testFiles);
		console.log(`Logged file for slide ${slideIndex} to test session.`);
	}

	const createSessionPartForSlide = (currentRemoteTestSessionId: string, slideIndex: number) => {
		addTestSessionPart(currentRemoteTestSessionId, slideIndex)
			.then((testSessionPart) => {
				console.log(`Logged slide ${slideIndex} to test session:`, testSessionPart);
				currentSessionPartId = testSessionPart.id;
			})
			.catch((err) => {
				console.error(`Failed to log slide ${slideIndex} to test session:`, err);
			});
	}

	const handleSlideChange = async (currentRemoteTestSessionId: string, currentSessionPartIdAtChange: string | null, previousSlideIndex: number | undefined, slideIndex: number | 'end') => {
		if (slideIndex === previousSlideIndex) {
			return;
		}
		if (previousSlideIndex !== undefined && currentSessionPartIdAtChange) {
			console.log(`Processing slide change from ${previousSlideIndex} to ${slideIndex}. Logging file for previous slide.`);
			await uploadFilesForSlide(currentRemoteTestSessionId, currentSessionPartIdAtChange, previousSlideIndex);
		}

		// If not end, then add new session part for the new slide
		if (slideIndex !== 'end') {
			createSessionPartForSlide(currentRemoteTestSessionId, slideIndex);
		}
	}

	// Slide change
	$effect(() => {
		const slideIndex = $currentTask?.currentSlideIndex;
		if (slideIndex !== undefined && slideIndex >= 0 && ($taskStage === TaskStage.Task || $taskStage === TaskStage.End)) {
			const prevSlideIndex = untrack(() => previousSlideIndex);
			console.log(`Current slide: ${slideIndex}, Previous slide: ${prevSlideIndex}`);

			// Capture both remoteTestSessionId and currentSessionPartId at the time of slide change
			const currentRemoteTestSessionId = untrack(() => $remoteTestSessionId);
			const currentSessionPartIdAtChange = untrack(() => currentSessionPartId);

			if (currentRemoteTestSessionId)
					untrack(() => handleSlideChange(currentRemoteTestSessionId, currentSessionPartIdAtChange, prevSlideIndex, $taskStage === TaskStage.End ? 'end' : slideIndex));

			previousSlideIndex = slideIndex;
		}
	});

	onDestroy(() => {
		if (!browser) return;

		analyticsManager.stopLogging(TaskResult.Terminate);
		if ($remoteTestSessionId) {
			abortTestSession($remoteTestSessionId)
				.then(() => {
					console.log('Test session aborted successfully.');
					$remoteTestSessionId = null;
				})
				.catch((err) => {
					console.error('Failed to abort test session:', err);
				});
		}
	});
</script>
