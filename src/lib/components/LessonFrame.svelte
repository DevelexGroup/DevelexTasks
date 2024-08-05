<script lang="ts">
	import type { LessonConfig } from '$lib/types/lesson';
	import type { GazeInteractionObjectSetFixation } from '@473783/develex-core';
	import { derived, writable } from 'svelte/store';
	import LessonCompleted from './LessonCompleted.svelte';
	import { fly } from 'svelte/transition';

	/**
	 * @type {LessonConfig}
	 * The lesson component that will be displayed as a lesson.
	 * It should accept a gazeFixationEmitter prop that will be used to register elements for fixation detection.
	 */
	export let lessonConfigResult: LessonConfig;

	/**
	 * @type {GazeInteractionObjectSetFixation}
	 * This fixation event detector always return an array of registered elements (aois) that were fixated on.
	 * They can overlap, so the array can contain multiple elements.
	 * When no element is fixated, the array is empty.
	 */
	export let gazeInteractionObjectSetFixation: GazeInteractionObjectSetFixation;

	let state: 'round' | 'error' | 'complete' = 'round';

	/**
	 * Lesson Track Logic
	 */
	const lessonProgress = writable(0);
	const lessonComplete = derived(
		lessonProgress,
		($lessonProgress) => $lessonProgress >= lessonConfigResult.content.length - 1
	);

	lessonProgress.subscribe((n) => {
		console.log('lessonProgress', n);
	});

	lessonComplete.subscribe((n) => {
		console.log('lessonComplete', n);
	});

	//const flyIn = { x: '100%', duration: 800, opacity: 1 };
	//const flyOut = { x: '-100%', duration: 800, opacity: 1 };
	const flyIn = { y: '100%', duration: 500, opacity: 0, delay: 500 };
	const flyOut = { duration: 200, opacity: 0 };
</script>

{#if state === 'round'}
	{#key $lessonProgress}
		<div
			class="absolute inset-0 left-0 top-0 flex h-full w-full items-center justify-center"
			in:fly={flyIn}
			out:fly={flyOut}
		>
			<svelte:component
				this={lessonConfigResult.component}
				gazeFixationEmitter={gazeInteractionObjectSetFixation}
				currentContent={lessonConfigResult.content[$lessonProgress]}
				on:lessonSuccess={() => {
					if ($lessonComplete) {
						state = 'complete';
						lessonProgress.set(0);
					} else {
						lessonProgress.update((n) => n + 1);
					}
				}}
			/>
		</div>
	{/key}
{:else if state === 'complete'}
	<div
		class="absolute inset-0 left-0 top-0 flex h-full w-full items-center justify-center"
		in:fly={flyIn}
		out:fly={flyOut}
	>
		<LessonCompleted />
	</div>
{/if}
