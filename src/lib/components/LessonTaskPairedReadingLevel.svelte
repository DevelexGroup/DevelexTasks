<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { derived } from 'svelte/store';
	import {
		getLogic,
		getPilotLogic,
		type GetLogicFunction
	} from './LessonTaskPairedReadingLevel.logic';
	import LessonTaskPairedReadingLayout from './LessonTaskPairedReadingLayout.svelte';
	import type { LessonTaskPairedReadingTaskProps } from './LessonTaskPairedReadingLevel.type';

	let {
		currentContent,
		speechEvaluator,
		speechRecognition,
		wordReader,
		shouldListenForVoice,
		bufferSize,
		logicType = 'main'
	}: LessonTaskPairedReadingTaskProps = $props();

	const dispatch = createEventDispatcher<{
		lessonSuccess: void;
		lessonMistake: void;
		lessonComplete: void;
		lessonFail: void;
	}>();

	const logicGetter: GetLogicFunction = logicType === 'main' ? getLogic : getPilotLogic;

	const {
		gridStateStore,
		wordsStore,
		onDestroyLogic,
		onMountLogic,
		crossRegisterFn,
		crossUnregisterFn,
		wordsRegisterFn,
		wordsUnregisterFn
	} = logicGetter(
		{
			currentContent,
			speechEvaluator,
			speechRecognition,
			shouldListenForVoice,
			bufferSize,
			wordReader
		},
		dispatch
	);

	const wordStore = derived(wordsStore, ($wordsStore) => {
		return $wordsStore;
	});

	onMount(() => {
		onMountLogic();
	});

	onDestroy(() => {
		onDestroyLogic();
	});
</script>

<LessonTaskPairedReadingLayout
	words={$wordStore}
	stage={$gridStateStore}
	{crossRegisterFn}
	{crossUnregisterFn}
	{wordsRegisterFn}
	{wordsUnregisterFn}
/>

<!-- <LessonLayoutPairedReading {validateFixation}>
	<LessonCross {registerElement} {unregisterElement} id={FIXATION_EYE} slot="cross-fix" />
	<svelte:fragment slot="word-area">
		<LessonWord {registerElement} {unregisterElement} word={currentContent} id={FIXATION_WORD} />
	</svelte:fragment>
</LessonLayoutPairedReading> -->
