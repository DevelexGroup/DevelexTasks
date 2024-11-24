<script lang="ts">
	import Lesson from '$lib/components/Lesson.svelte';
	import type { LessonConfigSyllables } from '$lib/types/lesson';
	import {
		createGazeInput,
		type GazeInputConfigWithFixations,
		type GazeInput,
		GazeInteractionScreenFixation,
		GazeInteractionObjectSetFixation
	} from '@473783/develex-core';
	import { inputCreationConfig, inputWindowFieldsConfig } from '$lib/stores/gazeConfig';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import LessonTaskSyllableLevel from '$lib/components/LessonTaskSyllableLevel.svelte';
	import { WordReaderSynthesis } from '$lib/services/WordReaderSynthesis';

	export let data: {
		config: {
			content: LessonConfigSyllables['content'];
			partialProps: Partial<LessonConfigSyllables['props']>;
			level: string;
		};
	};

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
		const gazeInput: GazeInput<GazeInputConfigWithFixations> = createGazeInput(
			get(inputCreationConfig)
		);
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

		const lessonConfig: LessonConfigSyllables['setup'] = {
			component: LessonTaskSyllableLevel,
			content: data.config.content,
			props: {
				wordReader: new WordReaderSynthesis(),
				gazeFixationEmitter: gazeInteractionObjectSetFixation,
				...data.config.partialProps
			},
			gazeInput,
			deInit
		};

		return lessonConfig;
	};

	const lessonConfig: Promise<LessonConfigSyllables['setup']> = getAsyncLessonConfig();
</script>

{#if data}
	<Lesson {lessonConfig} isDebug={false} />
{/if}
