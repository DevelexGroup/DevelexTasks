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
	import LessonTaskPairedReadingThreeContent from '$lib/components/LessonTaskPairedReadingThreeContent.svelte';
	import type { LessonConfig, LessonConfigPairedReadingThree } from '$lib/types/lesson';
	import { onMount } from 'svelte';
	import { SpeechRecognitionMdn } from '$lib/services/SpeechRecognitionMdn';
	import { SpeechEvaluatorSimple } from '$lib/services/SpeechEvaluatorSimple';
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

		const lessonConfig: LessonConfigPairedReadingThree = {
			component: LessonTaskPairedReadingThreeContent,
			content: [
				[
					[
						{
							text: 'Byla',
							id: '1'
						},
						{
							text: 'jednou',
							id: '2'
						},
						{
							text: 'jedna',
							id: '3'
						},
						{
							text: 'slepice.',
							id: '4'
						}
					],
					[
						{
							text: 'Slepice',
							id: '5'
						},
						{
							text: 'se',
							id: '6'
						},
						{
							text: 'jmenovala',
							id: '7'
						},
						{
							text: 'Kokoska.',
							id: '8'
						}
					],
					[
						{
							text: 'Kokoska',
							id: '9'
						},
						{
							text: 'měla',
							id: '10'
						},
						{
							text: 'dvě',
							id: '11'
						},
						{
							text: 'křídla.',
							id: '12'
						}
					]
				],
				[
					[
						{
							text: 'Kokoska',
							id: '13'
						},
						{
							text: 'se',
							id: '14'
						},
						{
							text: 'naučila',
							id: '15'
						},
						{
							text: 'létat.',
							id: '16'
						}
					],
					[
						{
							text: 'Kokoska',
							id: '17'
						},
						{
							text: 'létala',
							id: '18'
						},
						{
							text: 'do',
							id: '19'
						},
						{
							text: 'dáli.',
							id: '20'
						}
					]
				]
			],
			props: {
				gazeFixationEmitter: gazeInteractionObjectSetFixation,
				speechRecognition: new SpeechRecognitionMdn(),
				speechEvaluator: new SpeechEvaluatorSimple(),
				wordReader: new WordReaderSynthesis()
			},
			deInit
		};

		return lessonConfig;
	};
	const lessonConfig: Promise<LessonConfig> = getAsyncLessonConfig();
</script>

<Lesson {lessonConfig} />
