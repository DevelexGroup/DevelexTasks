<script lang="ts">
	import Lesson from '$lib/components/Lesson.svelte';
	import { SpeechEvaluatorSimple } from '$lib/services/SpeechEvaluatorSimple';
	import { SpeechRecognitionMdn } from '$lib/services/SpeechRecognitionMdn';
	import { WordReaderSynthesis } from '$lib/services/WordReaderSynthesis';
	import type { LessonConfigMap, LessonConfigSetupMap } from '$lib/types/lesson';

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
	const getLessonConfig = async (): Promise<LessonConfigSetupMap['pairedReading']> => {
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
		instructionAudioPath={data.config.instructionAudioPath}
		lessonName={data.config.level}
		{getLessonConfig}
		isDebug={false}
		backgroundColor="rgba(255, 254, 232, 0.5)"
		taskName="Dublované čtení"
	/>
{/if}
