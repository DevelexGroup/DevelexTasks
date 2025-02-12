<script lang="ts">
	import Lesson from '$lib/components/Lesson.svelte';
	import { SpeechEvaluatorSimple } from '$lib/services/SpeechEvaluatorSimple';
	import { SpeechRecognitionMdn } from '$lib/services/SpeechRecognitionMdn';
	import { WordReaderSynthesis } from '$lib/services/WordReaderSynthesis';
	import type { LessonConfigMap } from '$lib/types/lesson';

	interface Props {
		data: {
			config: LessonConfigMap['pairedReading']['data'];
		};
	}

	let { data }: Props = $props();

	/**
	 * It must return a lesson config object in a promise.
	 * This is necessitated to prevent problems with SSR and to allow for async loading of the lesson config.
	 */
	const getLessonConfig = async (): Promise<LessonConfigMap['pairedReading']['setup']> => {
		return {
			type: 'pairedReading',
			content: data.config.content,
			props: {
				wordReader: new WordReaderSynthesis(),
				speechEvaluator: new SpeechEvaluatorSimple(),
				speechRecognition: new SpeechRecognitionMdn(),
				...data.config.partialProps
			}
		};
	};
</script>

{#if data}
	<Lesson
		lessonName={data.config.level}
		{getLessonConfig}
		isDebug={false}
		backgroundColor="#FFFEE8"
	/>
{/if}
