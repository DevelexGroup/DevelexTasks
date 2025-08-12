<script lang="ts">
	import { type AnyLessonConfigSetup } from '$lib/types/lesson';
	import { writable, derived } from 'svelte/store';
	import LessonCompleted from './LessonCompleted.svelte';
	import { fly } from 'svelte/transition';
	import LessonMistake from './LessonMistake.svelte';
	import LessonFail from './LessonFail.svelte';
	import { lessonComponentMap } from '$lib/types/lesson';
	import { resolveAny } from '$lib/utils/resolveAny';

	interface Props {
		/**
		 * @type {LessonConfig}
		 * The lesson component that will be displayed as a lesson.
		 * It should accept a gazeFixationEmitter prop that will be used to register elements for fixation detection.
		 */
		lessonConfig: AnyLessonConfigSetup;
		backgroundColor?: string;
		onLessonStateTransition: (newState: string) => void;
	}

	let { lessonConfig, onLessonStateTransition, backgroundColor = 'transparent' }: Props = $props();

	let state: 'round' | 'fail' | 'complete' | 'mistake' = $state('round');

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
	const flyOut = { duration: 300, opacity: 0 };

	const successAudio = new Audio(resolveAny('/sound/success.wav'));
	successAudio.volume = 0.4;
	const roundCompleteAudio = new Audio(resolveAny('/sound/positive.wav'));
	roundCompleteAudio.volume = 0.4;
	const warningAudio = new Audio(resolveAny('/sound/warning.wav'));
	warningAudio.volume = 0.4;
	const completeAudio = new Audio(resolveAny('/sound/complete.wav'));
	completeAudio.volume = 0.4;
	const failAudio = new Audio(resolveAny('/sound/fail.wav'));

	const handleLessonSuccess = () => {
		successAudio.play(); // play success sound and do nothing
	};

	const handleLessonMistake = () => {
		warningAudio.play();
		state = 'mistake';
	};

	const handleLessonComplete = (e: CustomEvent<{ playRoundComplete: boolean }>) => {
		const isLessonComplete = $lessonProgress === lessonConfig.content.length - 1;

		if (isLessonComplete) {
			completeAudio.play();
			state = 'complete';
		} else {
			if (e.detail.playRoundComplete) {
				roundCompleteAudio.play();
			}

			lessonProgress.update((n) => n + 1);
		}
	};

	const handleLessonFail = () => {
		// failAudio.play();
		state = 'fail';
	};

	const handleStateTransition = (e: CustomEvent<string>) => {
		onLessonStateTransition(e.detail);
	};

	const LessonComponent = lessonComponentMap[lessonConfig.type];
</script>

<div
	class="absolute inset-0 left-0 top-0 flex h-full w-full items-center justify-center"
	style="background-color: {backgroundColor};"
>
	{#if state === 'round' || state === 'mistake'}
		{#key $lessonProgress}
			<div
				class="absolute inset-0 left-0 top-0 flex h-full w-full items-center justify-center"
				in:fly={flyIn}
				out:fly={flyOut}
			>
				<LessonComponent
					{...lessonConfig.props as any}
					currentContent={lessonConfig.content[$lessonProgress] as any}
					on:lessonSuccess={handleLessonSuccess}
					on:lessonMistake={handleLessonMistake}
					on:lessonComplete={handleLessonComplete}
					on:lessonFail={handleLessonFail}
					on:lessonFrameTransition={handleStateTransition}
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
</div>
