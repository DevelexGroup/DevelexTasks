<script lang="ts">
	import LessonTaskSyllableLayout from './LessonTaskSyllableLayout.svelte';
	import LessonCross from './LessonCross.svelte';
	import type { SyllableTaskType } from '$lib/types/lesson';
	import type { GazeInteractionObjectSetFixation } from '@473783/develex-core';
	import type { IWordReader } from '$lib/interfaces/IWordReader';
	import LessonTaskSyllableGrid from './LessonTaskSyllableGrid.svelte';

	export let currentContent: SyllableTaskType;
	export let gazeFixationEmitter: GazeInteractionObjectSetFixation;
	export let wordReader: IWordReader;

	let isCrossfixVisible: boolean = true;
	let isSyllableVisible: boolean = true;

	const FIXATION_EYE = 'fixation-eye';

	const registerElement = (element: HTMLElement) => {
		gazeFixationEmitter.register(element, {
			bufferSize: 150
		});
	};

	const unregisterElement = (element: HTMLElement) => {
		gazeFixationEmitter.unregister(element);
	};
</script>

<LessonTaskSyllableLayout {isCrossfixVisible} {isSyllableVisible}>
	<LessonCross {registerElement} {unregisterElement} id={FIXATION_EYE} slot="crossfix-area" />
	<LessonTaskSyllableGrid
		content={[currentContent]}
		{registerElement}
		{unregisterElement}
		hideAssignmentSyllables={[]}
		isSyllableAssignmentPresent={false}
		assignmentWidth={120}
		syllableGap={12}
	/>
</LessonTaskSyllableLayout>
