<script lang="ts">
	import { SpeechRecognitionMdn } from '$lib/services/SpeechRecognitionMdn';
	import { onMount } from 'svelte';
	const results = [];
	let recognition: SpeechRecognitionMdn;
	onMount(() => {
		recognition = new SpeechRecognitionMdn();
		recognition.onResult = (event) => {
			alert(event);
			results.push(event);
		};
	});
</script>

<h1 on:click={() => recognition.start()}>Speech</h1>
<div>
	{#each results as result}
		<p>{result}</p>
	{/each}
</div>
