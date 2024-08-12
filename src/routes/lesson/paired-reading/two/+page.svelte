<script lang="ts">
	import Lesson from '$lib/components/Lesson.svelte';
	import {
		createGazeInput,
		type GazeInputConfigWithFixations,
		type GazeInput,
		GazeInteractionScreenFixation,
		GazeInteractionObjectSetFixation
	} from '@473783/develex-core';
	import { inputCreationConfig, inputWindowFieldsConfig } from '$lib/stores/gazeConfig';
	import LessonTaskPairedReadingTwoContent from '$lib/components/LessonTaskPairedReadingTwoContent.svelte';
	import type { LessonConfig } from '$lib/types/lesson';
	import { onMount } from 'svelte';
	import { SpeechRecognitionMdn } from '$lib/services/SpeechRecognitionMdn';
	import { SpeechEvaluatorSimple } from '$lib/services/SpeechEvaluatorSimple';
	import { get } from 'svelte/store';
	import { WordReaderSynthesis } from '$lib/services/WordReaderSynthesis';

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
		const windowconfig = get(inputWindowFieldsConfig);
		if (windowconfig) {
			gazeInput.setWindowCalibration(windowconfig.mouse, windowconfig.window);
		} else {
			console.error('No window config');
		}
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

		return {
			component: LessonTaskPairedReadingTwoContent,
			content: [
				['Máma', 'mele', 'maso'],
				['Malý', 'osmiletý', 'chlapec', 'Adam', 'stál', 'u okna'],
				['Adam', 'sledoval', 'silnici', 'vedoucí', 'k jejich', 'domu']
			],
			props: {
				gazeFixationEmitter: gazeInteractionObjectSetFixation,
				speechRecognition: new SpeechRecognitionMdn(),
				speechEvaluator: new SpeechEvaluatorSimple(),
				wordReader: new WordReaderSynthesis()
			},
			gazeInput,
			deInit
		};

		return lessonConfig;
	};
	const lessonConfig: Promise<LessonConfig> = getAsyncLessonConfig();
</script>

<Lesson {lessonConfig} isDebug={false} />
