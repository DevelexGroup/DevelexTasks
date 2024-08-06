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
	import LessonTaskPairedReadingZeroVoiceContent from '$lib/components/LessonTaskPairedReadingZeroVoiceContent.svelte';
	import type { LessonConfig, LessonConfigPairedReadingZeroVoice } from '$lib/types/lesson';
	import { onMount } from 'svelte';
	import { SpeechRecognitionMdn } from '$lib/services/SpeechRecognitionMdn';
	import { SpeechEvaluatorSimple } from '$lib/services/SpeechEvaluatorSimple';

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

		const deInit = () => {
			gazeInput.stop();
			gazeInput.disconnect();
		};

		const lessonConfig: LessonConfigPairedReadingZeroVoice = {
			component: LessonTaskPairedReadingZeroVoiceContent,
			content: ['Jsou', 'jen', 'malí', 'zločinci'],
			props: {
				gazeFixationEmitter: gazeInteractionObjectSetFixation,
				speechRecognition: new SpeechRecognitionMdn(),
				speechEvaluator: new SpeechEvaluatorSimple()
			},
			deInit
		};

		return lessonConfig;
	};
	const lessonConfig: Promise<LessonConfig> = getAsyncLessonConfig();
</script>

<Lesson {lessonConfig} />
