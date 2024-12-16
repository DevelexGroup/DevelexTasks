<script lang="ts">
	import type { ISpeechRecognitionResult } from '$lib/interfaces/ISpeechRecognition';
	import { SpeechRecognitionMdn } from '$lib/services/SpeechRecognitionMdn';
	import { onMount } from 'svelte';

	let results: ISpeechRecognitionResult[] = $state([]);

	let recognition: SpeechRecognitionMdn;
	let isOn = $state(false);

	const handleResult = (event: ISpeechRecognitionResult) => {
		console.warn(event);
		results = [...results, event];
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
<div class="box-border h-96 w-full overflow-y-scroll bg-slate-100 p-4">
	<table class="box-border w-full p-4">
		<thead>
			<tr class="border-b border-gray-300 p-4 text-left">
				<th>Timestamp</th>
				<th>Transcript</th>
				<th>Confidence</th>
				<th>Final</th>
			</tr>
		</thead>
		<tbody>
			{#each results as result}
				{#if result}
					{#each result.values as value}
						<tr>
							<td
								>{new Date(result.timestamp).toLocaleTimeString('en-US', {
									hour: '2-digit',
									minute: '2-digit',
									second: '2-digit'
								})}</td
							>
							<td>{value.transcript}</td>
							<td>{value.confidence}</td>
							<td>{result.isFinal}</td>
						</tr>
					{/each}
				{/if}
			{/each}
		</tbody>
	</table>
</div>
