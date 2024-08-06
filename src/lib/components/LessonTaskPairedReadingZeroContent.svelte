<script lang="ts">
	import LessonCross from './LessonCross.svelte';
	import { createEventDispatcher } from 'svelte';
	import type { GazeInteractionObjectSetFixation } from '@473783/develex-core';
	import LessonWord from './LessonWord.svelte';
	import LessonLayoutPairedReading from './LessonLayoutPairedReading.svelte';

	export let gazeFixationEmitter: GazeInteractionObjectSetFixation;
	export let currentContent: string;

	const FIXATION_EYE = 'fixation-eye';
	const FIXATION_WORD = 'fixation-word';

	let validateFixation = true;

	const registerElement = (element: HTMLElement) => {
		gazeFixationEmitter.register(element, {
			bufferSize: 150
		});
	};

	const unregisterElement = (element: HTMLElement) => {
		gazeFixationEmitter.unregister(element);
	};

	gazeFixationEmitter.on('fixationSetEnd', (event) => {
		const { target } = event;

		if (!Array.isArray(target) || target.length <= 0) {
			return;
		}

		if (target.some((t) => t.id === FIXATION_EYE)) {
			validateFixation = false;
			dispatch('lessonSuccess');
			return;
		}

		if (target.some((t) => t.id === FIXATION_WORD)) {
			if (validateFixation) return;
			nextZeroLevel();
		}
	});

	const dispatch = createEventDispatcher<{
		lessonSuccess: void;
		lessonMistake: void;
		lessonComplete: void;
	}>();

	const nextZeroLevel = () => {
		setTimeout(() => {
			dispatch('lessonComplete');
		}, 300);
	};
</script>

<LessonLayoutPairedReading {validateFixation}>
	<LessonCross {registerElement} {unregisterElement} id={FIXATION_EYE} slot="cross-fix" />
	<svelte:fragment slot="word-area">
		<LessonWord {registerElement} {unregisterElement} word={currentContent} id={FIXATION_WORD} />
	</svelte:fragment>
</LessonLayoutPairedReading>
