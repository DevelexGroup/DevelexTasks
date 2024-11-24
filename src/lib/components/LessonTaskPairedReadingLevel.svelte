<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import type { GazeInteractionObjectFixation } from '@473783/develex-core';
	import type { ISpeechEvaluator } from '$lib/interfaces/ISpeechEvaluator';
	import type { ISpeechRecognition } from '$lib/interfaces/ISpeechRecognition';
	import { derived } from 'svelte/store';
	import type { PairedReadingTaskType } from '$lib/types/lesson';
	import {
		getLogic,
		getPilotLogic,
		type GetLogicFunction
	} from './LessonTaskPairedReadingLevel.logic';
	import type { IWordReader } from '$lib/interfaces/IWordReader';
	import LessonTaskPairedReadingLayout from './LessonTaskPairedReadingLayout.svelte';

	export let gazeFixationEmitter: GazeInteractionObjectFixation;
	export let currentContent: PairedReadingTaskType;
	export let speechEvaluator: ISpeechEvaluator;
	export let speechRecognition: ISpeechRecognition;
	export let wordReader: IWordReader;
	export let shouldListenForVoice: boolean;
	export let bufferSize: number;
	export let logicType: 'main' | 'pilot' = 'main';

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
			gazeFixationEmitter,
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
