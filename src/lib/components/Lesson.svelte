<script lang="ts">
	import LessonError from '$lib/components/LessonError.svelte';
	import LessonLoad from '$lib/components/LessonLoad.svelte';
	import type { LessonConfig } from '$lib/types/lesson';
	import { fly } from 'svelte/transition';
	import LessonFrame from './LessonFrame.svelte';
	import { onDestroy } from 'svelte';
	import LessonDebug from './LessonDebug.svelte';

	

	
	interface Props {
		/**
	 * @type {Promise<LessonConfig>}
	 * The lesson component that will be displayed as a lesson.
	 * It should accept a gazeFixationEmitter prop that will be used to register elements for fixation detection.
	 */
		lessonConfig: Promise<LessonConfig['setup']>;
		/**
	 * @type {boolean}
	 * Indicates if the application is in debug mode. If so, the LessonDebug component will be displayed.
	 */
		isDebug: boolean;
	}

	let { lessonConfig, isDebug }: Props = $props();

	const handleError = (event: Event) => {
		console.log(event);
		const error = event instanceof ErrorEvent ? event.error : event;
		const message = error instanceof Error ? error.message : error.toString();
		errorMessages = [...errorMessages, message];
	};

	let errorMessages: string[] = $state([]);

	const flyIn = { y: '100%', duration: 750, opacity: 0, delay: 500 };
	const flyOut = { duration: 200, opacity: 0 };

	onDestroy(() => {
		lessonConfig.then((lessonConfigResult) => {
			lessonConfigResult.deInit();
		});
	});
</script>

<svelte:window onerror={handleError} />

<div class="relative flex h-screen w-screen items-center justify-center overflow-hidden">
	{#await lessonConfig}
		<div
			class="absolute inset-0 left-0 top-0 flex h-full w-full items-center justify-center"
			in:fly={flyIn}
			out:fly={flyOut}
		>
			<LessonLoad />
		</div>
	{:then lessonConfigResult}
		{#if errorMessages.length > 0}
			<div
				class="absolute inset-0 left-0 top-0 flex h-full w-full items-center justify-center"
				in:fly={flyIn}
				out:fly={flyOut}
			>
				<LessonError {errorMessages} />
			</div>
		{:else}
			<LessonFrame {lessonConfigResult} />
		{/if}
		{#if isDebug}
			<LessonDebug gazeInput={lessonConfigResult.gazeInput} />
		{/if}
	{:catch catchedError}
		<div
			class="absolute inset-0 left-0 top-0 flex h-full w-full items-center justify-center"
			in:fly={flyIn}
			out:fly={flyOut}
		>
			<LessonError errorMessages={[catchedError.message]} />
		</div>
	{/await}
</div>
