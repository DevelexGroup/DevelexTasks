<script lang="ts">
	import Lesson from '$lib/components/Lesson.svelte';
	import {
		createGazeInput,
		type GazeInputConfigWithFixations,
		type GazeInput,
		GazeInteractionScreenFixation,
		GazeInteractionObjectSetFixation
	} from '@473783/develex-core';
	import { inputCreationConfig } from '$lib/stores/gazeConfig';
	import LessonTaskPairedReadingZeroContent from '$lib/components/LessonTaskPairedReadingZeroContent.svelte';
	import type { LessonConfig } from '$lib/types/lesson';
	import { onMount } from 'svelte';

	/**
	 * In the future, it can query for a specific lesson configuration.
	 */
	const getAsyncLessonConfig = async () => {
		void (await new Promise<void>((resolve, reject) => {
			onMount(() => {
				// check if in browser or not
				if (typeof window === 'undefined') {
					reject('Not in browser');
					return;
				}
				resolve();
			});
		}));
		const gazeInput: GazeInput<GazeInputConfigWithFixations> =
			createGazeInput($inputCreationConfig);
		const gazeInteractionScreenFixation = new GazeInteractionScreenFixation();
		const gazeInteractionObjectSetFixation = new GazeInteractionObjectSetFixation();
		gazeInteractionScreenFixation.connect(gazeInput);
		gazeInteractionObjectSetFixation.connect(gazeInteractionScreenFixation);
		await gazeInput.connect();
		await gazeInput.start();
		return {
			component: LessonTaskPairedReadingZeroContent,
			content: ['Jsou', 'jen', 'malí', 'zločinci'],
			gazeInteractionObjectSetFixation
		};
	};

	const lessonConfig: Promise<LessonConfig> = getAsyncLessonConfig();
</script>

<Lesson {lessonConfig} />
