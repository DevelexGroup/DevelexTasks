<script lang="ts">
	import { browser } from '$app/environment';
	import { currentTask, remoteTestSessionId, taskStage } from '$lib/stores/task';
	import { TaskResult, TaskStage } from '$lib/types/task.types';
	import { getContext, onDestroy, untrack } from 'svelte';
	import { ANALYTICS_MANAGER_KEY } from '$lib/types/general.types';
	import type { AnalyticsManager } from '$lib/utils/analyticsManager';
	import {
		abortTestSession, addFileToTestSessionPart,
		addTestSessionPart,
		completeTestSession,
		createTestSession
	} from '$lib/api/test-sessions';

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

	const createTestFile = (slideIndex: number) => {
		// Create a test blob file here based on the slide index or other relevant data
		const blobContent = `Test data for slide ${slideIndex}`;
		const blob = new Blob([blobContent], { type: 'text/plain' });
		return new File([blob], `slide-${slideIndex}-data.txt`, { type: 'text/plain' });
	}

	const handleSlideChange = async (previousSlideIndex: number | undefined, slideIndex: number | 'end') => {
		if ($remoteTestSessionId) {
			if (previousSlideIndex && currentSessionPartId) {
				console.log(`Processing slide change from ${previousSlideIndex} to ${slideIndex}. Logging file for previous slide.`);
				// Wait for previous session to fully log into local database before adding the files
				await analyticsManager.waitForSlideProcessing(previousSlideIndex);
				// Create a test blob file here in this function
				const testFile = createTestFile(previousSlideIndex);
				// Add the file to the current session part
				addFileToTestSessionPart($remoteTestSessionId, currentSessionPartId, testFile)
					.then(() => {
						console.log(`Logged file for slide ${previousSlideIndex} to test session.`);
					})
					.catch((err) => {
						console.error(`Failed to log file for slide ${previousSlideIndex} to test session:`, err);
					});
			}

			// If not end, then add new session part for the new slide
			if (slideIndex !== 'end') {
				addTestSessionPart($remoteTestSessionId, slideIndex)
					.then((testSessionPart) => {
						console.log(`Logged slide ${slideIndex} to test session:`, testSessionPart);
						currentSessionPartId = testSessionPart.id;
					})
					.catch((err) => {
						console.error(`Failed to log slide ${slideIndex} to test session:`, err);
					});
			}
		}
	}

	// Slide change
	$effect(() => {
		const slideIndex = $currentTask?.currentSlideIndex;
		if (slideIndex !== undefined && slideIndex >= 0 && $taskStage === TaskStage.Task) {
			const prevSlideIndex = untrack(() => previousSlideIndex);
			console.log(`Current slide: ${slideIndex}, Previous slide: ${prevSlideIndex}`);

			untrack(() => handleSlideChange(previousSlideIndex, slideIndex));

			// Update previous slide index after processing
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
