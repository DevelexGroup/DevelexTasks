<script lang="ts">
	import LessonError from '$lib/components/LessonError.svelte';
	import LessonLoad from '$lib/components/LessonLoad.svelte';
	import type { LessonConfig } from '$lib/types/lesson';
	import { fly } from 'svelte/transition';
	import LessonFrame from './LessonFrame.svelte';
	import { onDestroy, getContext } from 'svelte';
	import LessonDebug from './LessonDebug.svelte';
	import type { GazeManager } from '@473783/develex-core';

	interface Props {
		/**
		 * The lesson component that will be displayed as a lesson.
		 * It should accept a gazeFixationEmitter prop that will be used to register elements for fixation detection.
		 */
		lessonConfig: LessonConfig['setup'];
		/**
		 * @type {boolean}
		 * Indicates if the application is in debug mode. If so, the LessonDebug component will be displayed.
		 */
		isDebug: boolean;
	}

	let { lessonConfig, isDebug }: Props = $props();
	lessonConfig.content;
	const handleError = (event: Event) => {
		console.log(event);
		const error = event instanceof ErrorEvent ? event.error : event;
		const message = error instanceof Error ? error.message : error.toString();
		errorMessages = [...errorMessages, message];
	};

	let errorMessages: string[] = $state([]);

	let lessonState: 'loading' | 'error' | 'lessonFrame' = $state('loading');

	const flyIn = { y: '100%', duration: 750, opacity: 0, delay: 500 };
	const flyOut = { duration: 200, opacity: 0 };

	const gazeManager = getContext<GazeManager>('gazeManager');

	onDestroy(() => {
		gazeManager.stop();
		gazeManager.disconnect();
	});
</script>

<svelte:window onerror={handleError} />

<div class="relative flex h-screen w-screen items-center justify-center overflow-hidden">
	{#if lessonState === 'loading'}
		<div
			class="absolute inset-0 left-0 top-0 flex h-full w-full items-center justify-center"
			in:fly={flyIn}
			out:fly={flyOut}
		>
			<LessonLoad onLoad={() => (lessonState = 'lessonFrame')} />
		</div>
	{:else if lessonState === 'error'}
		<div
			class="absolute inset-0 left-0 top-0 flex h-full w-full items-center justify-center"
			in:fly={flyIn}
			out:fly={flyOut}
		>
			<LessonError {errorMessages} />
		</div>
	{:else if lessonState === 'lessonFrame'}
		<div
			class="absolute inset-0 left-0 top-0 flex h-full w-full items-center justify-center"
			in:fly={flyIn}
			out:fly={flyOut}
		>
			<LessonFrame {lessonConfig} />
		</div>
	{/if}
	{#if isDebug}
		<LessonDebug />
	{/if}
</div>
