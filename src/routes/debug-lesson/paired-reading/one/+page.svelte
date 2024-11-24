<script lang="ts">
	import Lesson from '$lib/components/Lesson.svelte';
	import {
		createGazeInput,
		type GazeInputConfigWithFixations,
		type GazeInput,
		GazeInteractionScreenFixation,
		GazeInteractionObjectFixation
	} from '@473783/develex-core';
	import { inputCreationConfig, inputWindowFieldsConfig } from '$lib/stores/gazeConfig';
	import LessonTaskPairedReadingOneContent from '$lib/components/LessonTaskPairedReadingOneContent.svelte';
	import type { LessonConfig, LessonConfigPairedReadingOne } from '$lib/types/lesson';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';

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
		const gazeInteractionObjectFixation = new GazeInteractionObjectFixation();
		gazeInteractionScreenFixation.connect(gazeInput);
		gazeInteractionObjectFixation.connect(gazeInteractionScreenFixation);
		await gazeInput.connect();
		await gazeInput.start();

		const deInit = () => {
			gazeInput.stop();
			gazeInput.disconnect();
		};

		const lessonConfig: LessonConfigPairedReadingOne = {
			component: LessonTaskPairedReadingOneContent,
			content: [
				['Máma', 'mele', 'maso'],
				['Malý', 'osmiletý', 'chlapec', 'Adam', 'stál', 'u okna'],
				['Adam', 'sledoval', 'silnici', 'vedoucí', 'k jejich', 'domu']
			],
			props: {
				gazeFixationEmitter: gazeInteractionObjectFixation
			},
			gazeInput,
			deInit
		};

		return lessonConfig;
	};

	const lessonConfig: Promise<LessonConfig> = getAsyncLessonConfig();
</script>

<Lesson {lessonConfig} isDebug={true} />
