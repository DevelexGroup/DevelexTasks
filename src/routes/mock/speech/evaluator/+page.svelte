<script lang="ts">
	import { run } from 'svelte/legacy';

	import type { ISpeechRecognitionResult } from '$lib/interfaces/ISpeechRecognition';
	import { SpeechRecognitionMdn } from '$lib/services/SpeechRecognitionMdn';
	import { SpeechEvaluatorSimple } from '$lib/services/SpeechEvaluatorSimple';
	import { onMount } from 'svelte';
	import type { ISpeechEvaluatorResult } from '$lib/interfaces/ISpeechEvaluator';

	let results: ISpeechRecognitionResult[] = $state([]);

	let wordToCompare: string = $state('hello');
	let evaluator = $state(new SpeechEvaluatorSimple(wordToCompare));
	let evaluatorResults: ISpeechEvaluatorResult[] = $state([]);
	let evaluatorTargetWord = $derived(wordToCompare);

	let recognition: SpeechRecognitionMdn;
	let isOn = $state(false);

	const handleResult = (event: ISpeechRecognitionResult) => {
		console.warn(event);
		results = [...results, event];
		evaluatorResults = [...evaluatorResults, evaluator.evaluateSpeech(event)];
	};

	onMount(() => {
		isOn = recognition.isOn;
		recognition = new SpeechRecognitionMdn();
		recognition.on('speech', handleResult);
		recognition.on('error', (error) => {
			console.error(error);
		});
		recognition.on('start', () => {
			results = [];
			isOn = true;
		});
		recognition.on('end', () => {
			isOn = false;
		});
	});
</script>

<h1 class="mb-4 text-2xl font-bold">
	Speech Recognition<span
		class="mb-2 ml-2 inline-block h-3 w-3 rounded-full {isOn ? 'bg-green-500' : 'bg-red-500'}"
	></span>
</h1>

<div class="mb-4 flex justify-center gap-2">
	<button
		class="rounded-md bg-blue-500 px-4 py-2 text-white"
		onclick={() => {
			recognition.start();
		}}
	>
		Start
	</button>
	<button
		class="rounded-md bg-red-500 px-4 py-2 text-white"
		onclick={() => {
			recognition.stop();
		}}
	>
		Stop
	</button>
</div>
<h2 class="my-4 text-2xl font-bold">Word to Compare</h2>
<input type="text" bind:value={wordToCompare} class="mb-4 w-full bg-slate-100 p-2" />
<h2 class="my-4 text-2xl font-bold">Evaluator Results</h2>
<div class="box-border h-72 w-full overflow-y-scroll bg-slate-100 p-4">
	<table class="box-border w-full p-4">
		<thead>
			<tr class="border-b border-gray-300 p-4 text-left">
				<th>Timestamp</th>
				<th>Correct</th>
				<th>Recognition Confidence</th>
				<th>Evaluation Confidence</th>
				<th>Target Word</th>
				<th>Spoken Word</th>
			</tr>
		</thead>
		<tbody>
			{#each evaluatorResults as result}
				{#if result}
					<tr class={result.isCorrect ? 'bg-green-100' : 'bg-red-100'}>
						<td
							>{new Date(result.timestamp).toLocaleTimeString('en-US', {
								hour: '2-digit',
								minute: '2-digit',
								second: '2-digit'
							})}</td
						>
						<td>{result.isCorrect}</td>
						<td>{result.recognitionConfidence}</td>
						<td>{result.evaluationConfidence}</td>
						<td>{result.targetWord}</td>
						<td>{result.spokenWord}</td>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</div>
