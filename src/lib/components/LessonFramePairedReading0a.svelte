<script lang="ts">
	import type { GazeInteractionObjectSetFixation } from '@473783/develex-core';
	import {
		FIXATION_EYE,
		FIXATION_WORD,
		level,
		nextSentenceWord,
		nextZeroLevel,
		sentenceWord,
		sentenceWordComplete
	} from '$lib/stores/level';
	import LessonZero from './LessonZero.svelte';
	import LessonOne from './LessonOne.svelte';

	export let gazeFixationEmitter: GazeInteractionObjectSetFixation;

	let validateFixation = true;

	const registerElement = (element: HTMLElement) => {
		gazeFixationEmitter.register(element, {
			bufferSize: 10
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
		} else if (target.some((t) => t.id === FIXATION_WORD)) {
			validateFixation = true;
			nextZeroLevel();
		} else if (target.some((t) => t.id === `${FIXATION_WORD}-${$sentenceWord}`)) {
			if (nextSentenceWord()) {
				validateFixation = true;
			}
		}
	});
</script>

{#if $level == 0}
	<LessonZero {registerElement} {unregisterElement} {validateFixation} />
{:else if $level == 1}
	<LessonOne {registerElement} {unregisterElement} {validateFixation} />
{/if}
