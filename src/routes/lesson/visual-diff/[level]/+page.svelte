<script lang="ts">
	import Lesson from '$lib/components/Lesson.svelte';
	import type { LessonConfigMap, LessonConfigSetupMap } from '$lib/types/lesson';
	import { WordReaderSynthesis } from '$lib/services/WordReaderSynthesis';

	interface Props {
		data: {
			config: LessonConfigMap['visualDiff']['data'];
		};
	}

	let { data }: Props = $props();

	/**
	 * It must return a lesson config object in a promise.
	 * This is necessitated to prevent problems with SSR and to allow for async loading of the lesson config.
	 */
	const getLessonConfig = async (): Promise<LessonConfigSetupMap['visualDiff']> => {
		return {
			type: 'visualDiff',
			content: data.config.content,
			props: {
				wordReader: new WordReaderSynthesis(),
				...data.config.partialProps
			}
		};
	};
</script>

{#if data}
	<Lesson
		instructionAudioPath={data.config.instructionAudioPath}
		{getLessonConfig}
		isDebug={false}
		backgroundColor="rgba(255, 253, 208, 0.5)"
		lessonName={data.config.label ?? data.config.level}
		taskName="Zraková diferenciace"
	/>
{/if}
