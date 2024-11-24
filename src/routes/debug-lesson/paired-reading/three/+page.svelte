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
	import LessonTaskPairedReadingThreeContent from '$lib/components/LessonTaskPairedReadingThreeContent.svelte';
	import type { LessonConfig, LessonConfigPairedReadingThree } from '$lib/types/lesson';
	import { onMount } from 'svelte';
	import { SpeechRecognitionMdn } from '$lib/services/SpeechRecognitionMdn';
	import { SpeechEvaluatorSimple } from '$lib/services/SpeechEvaluatorSimple';
	import { WordReaderSynthesis } from '$lib/services/WordReaderSynthesis';
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

		const lessonConfig: LessonConfigPairedReadingThree = {
			component: LessonTaskPairedReadingThreeContent,
			content: [
				[
					[
						{
							text: 'Můj',
							id: '1'
						},
						{
							text: 'kamarád',
							id: '2'
						},
						{
							text: 'Honzík',
							id: '3'
						},
						{
							text: 'má.',
							id: '4'
						},
						{
							text: 'doma',
							id: '5'
						},
						{
							text: 'dva',
							id: '6'
						},
						{
							text: 'papoušky.',
							id: '7'
						}
					],
					[
						{
							text: 'Každé',
							id: '8'
						},
						{
							text: 'ráno',
							id: '9'
						},
						{
							text: 'je',
							id: '10'
						},
						{
							text: 'rád',
							id: '11'
						},
						{
							text: 'krmí.',
							id: '12'
						}
					],
					[
						{
							text: 'Když',
							id: '13'
						},
						{
							text: 'Honzík',
							id: '14'
						},
						{
							text: 'přijde',
							id: '15'
						},
						{
							text: 'domů',
							id: '16'
						},
						{
							text: 'ze školy,',
							id: '17'
						},
						{
							text: 'papoušci',
							id: '18'
						},
						{
							text: 'vždy',
							id: '19'
						},
						{
							text: 'vesele',
							id: '20'
						},
						{
							text: 'zapískají.',
							id: '21'
						}
					]
				],
				[
					[
						{
							text: 'Malý',
							id: '22'
						},
						{
							text: 'osmiletý',
							id: '23'
						},
						{
							text: 'chlapec',
							id: '24'
						},
						{
							text: 'Adam',
							id: '25'
						},
						{
							text: 'stál',
							id: '26'
						},
						{
							text: 'u okna.',
							id: '27'
						}
					],
					[
						{
							text: 'Sledoval',
							id: '28'
						},
						{
							text: 'totiž',
							id: '29'
						},
						{
							text: 'silnici',
							id: '30'
						},
						{
							text: 'vedoucí',
							id: '31'
						},
						{
							text: 'k jejich',
							id: '32'
						},
						{
							text: 'domu.',
							id: '33'
						}
					],
					[
						{
							text: 'Za chvíli',
							id: '34'
						},
						{
							text: 'by se',
							id: '35'
						},
						{
							text: 'mělo',
							id: '36'
						},
						{
							text: 'objevit.',
							id: '37'
						},
						{
							text: 'tatínkovo',
							id: '38'
						},
						{
							text: 'auto',
							id: '39'
						},
						{
							text: 's přívěsem',
							id: '40'
						},
						{
							text: 'na koně.',
							id: '41'
						}
					],
					[
						{
							text: 'Adam',
							id: '42'
						},
						{
							text: 'má',
							id: '43'
						},
						{
							text: 'koně',
							id: '44'
						},
						{
							text: 'moc',
							id: '45'
						},
						{
							text: 'rád.',
							id: '46'
						}
					]
				]
			],
			props: {
				gazeFixationEmitter: gazeInteractionObjectFixation,
				speechRecognition: new SpeechRecognitionMdn(),
				speechEvaluator: new SpeechEvaluatorSimple(),
				wordReader: new WordReaderSynthesis(),
				shouldHighlightWords: true
			},
			gazeInput,
			deInit
		};

		return lessonConfig;
	};
	const lessonConfig: Promise<LessonConfig> = getAsyncLessonConfig();
</script>

<Lesson {lessonConfig} isDebug={true} />
