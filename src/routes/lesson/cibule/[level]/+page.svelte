<script lang="ts">
	import Lesson from '$lib/components/Lesson.svelte';
	import type { LessonConfigMap } from '$lib/types/lesson';
	import { type GazeManager } from '@473783/develex-core';
	import { inputCreationConfig, inputWindowFieldsConfig } from '$lib/stores/gazeConfig';
	import { onMount, getContext } from 'svelte';
	import { get } from 'svelte/store';
	import { WordReaderSynthesis } from '$lib/services/WordReaderSynthesis';

	interface Props {
		data: {
			config: LessonConfigMap['cibule']['data'];
		};
	}

	let { data }: Props = $props();

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
		await gazeInput.connect();
		await gazeInput.start();

		const deInit = () => {
			gazeInput.stop();
			gazeInput.disconnect();
		};

		const lessonConfig: LessonConfigMap['cibule']['setup'] = {
			type: 'cibule',
			content: data.config.content,
			props: {
				wordReader: new WordReaderSynthesis(),
				gazeFixationEmitter: gazeInteractionObjectFixation,
				...data.config.partialProps
			},
			gazeInput,
			deInit
		};

		return lessonConfig;
	};

	const gazeManager = getContext('gazeManager');

	const lessonConfig: Promise<LessonConfigMap['cibule']['setup']> = getAsyncLessonConfig();
</script>

{#if data}
	<Lesson {lessonConfig} isDebug={false} />
{/if}
