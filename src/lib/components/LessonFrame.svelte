<script lang="ts">
	import type { LessonConfig } from '$lib/types/lesson';
	import { derived, writable } from 'svelte/store';
	import LessonCompleted from './LessonCompleted.svelte';
	import { fly } from 'svelte/transition';
	import LessonMistake from './LessonMistake.svelte';
	import LessonFail from './LessonFail.svelte';

	/**
	 * @type {LessonConfig}
	 * The lesson component that will be displayed as a lesson.
	 * It should accept a gazeFixationEmitter prop that will be used to register elements for fixation detection.
	 */
	export let lessonConfigResult: LessonConfig;

	let state: 'round' | 'fail' | 'complete' | 'mistake' = 'round';

	/**
	 * Lesson Track Logic
	 */
	const lessonProgress = writable(0);

	lessonProgress.subscribe((n) => {
		console.log('lessonProgress', n);
	});

	//const flyIn = { x: '100%', duration: 800, opacity: 1 };
	//const flyOut = { x: '-100%', duration: 800, opacity: 1 };
	const flyIn = { y: '100%', duration: 500, opacity: 0, delay: 500 };
	const flyOut = { duration: 200, opacity: 0 };

	const successAudio = new Audio('/sound/success.wav');
	const roundCompleteAudio = new Audio('/sound/positive.wav');
	const warningAudio = new Audio('/sound/warning.wav');
	const completeAudio = new Audio('/sound/complete.wav');
	const failAudio = new Audio('/sound/fail.wav');

	const handleLessonSuccess = () => {
		successAudio.play(); // play success sound and do nothing
	};

	const handleLessonMistake = () => {
		warningAudio.play();
		state = 'mistake';
	};

	const handleLessonComplete = () => {
		const isLessonComplete = $lessonProgress === lessonConfigResult.content.length - 1;

		if (isLessonComplete) {
			completeAudio.play();
			state = 'complete';
		} else {
			roundCompleteAudio.play();
			lessonProgress.update((n) => n + 1);
		}
	};

	const handleLessonFail = () => {
		failAudio.play();
		state = 'fail';
	};
</script>

{#if state === 'round' || state === 'mistake'}
	{#key $lessonProgress}
		<div
			class="absolute inset-0 left-0 top-0 flex h-full w-full items-center justify-center"
			in:fly={flyIn}
			out:fly={flyOut}
		>
			<svelte:component
				this={lessonConfigResult.component}
				{...lessonConfigResult.props}
				currentContent={lessonConfigResult.content[$lessonProgress]}
				on:lessonSuccess={handleLessonSuccess}
				on:lessonMistake={handleLessonMistake}
				on:lessonComplete={handleLessonComplete}
				on:lessonFail={handleLessonFail}
			/>
		</div>
	{/key}
	{#if state === 'mistake'}
		<div
			class="z-100 absolute inset-0 left-0 top-0 flex h-full w-full items-center justify-center"
			in:fly={{ duration: 500, opacity: 0 }}
			out:fly={flyOut}
		>
			<LessonMistake
				on:lessonMistakeRepeat={() => {
					state = 'round';
				}}
			/>
		</div>
	{/if}
{:else if state === 'complete'}
	<div
		class="absolute inset-0 left-0 top-0 flex h-full w-full items-center justify-center"
		in:fly={flyIn}
		out:fly={flyOut}
	>
		<LessonCompleted />
	</div>
{:else if state === 'fail'}
	<div
		class="absolute inset-0 left-0 top-0 flex h-full w-full items-center justify-center"
		in:fly={flyIn}
		out:fly={flyOut}
	>
		<LessonFail />
	</div>
{/if}
