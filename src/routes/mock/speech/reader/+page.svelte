<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { WordReaderSynthesis } from '$lib/services/WordReaderSynthesis';
	let sentence: string = 'Mama mele maso';
	let currentWord: string | null = null;
	let isReading: boolean = false;
	let reader: WordReaderSynthesis | null = null;

	// Initialize the reader only on the client side
	onMount(() => {
		if (browser) {
			reader = new WordReaderSynthesis();
		} else {
			console.error('Speech synthesis is not available on the server.');
		}

		return () => {
			if (reader) {
				reader.abort();
			}
		};
	});

	const play = () => {
		if (!reader) {
			console.error('Speech synthesis is not available.');
			return;
		}

		isReading = true;
		currentWord = null;

		// Split the sentence into words
		const words = sentence
			.split(' ')
			.filter((word) => word.trim() !== '')
			.map((word) => ({ text: word }));

		// Assign the onWordChange callback before starting to read
		reader.onWordChange = (word) => {
			currentWord = word;
		};

		// Read the words
		reader
			.read(words)
			.then(() => {
				isReading = false;
				currentWord = null;
			})
			.catch((error) => {
				console.error('Error during speech synthesis:', error);
				isReading = false;
				currentWord = null;
			});
	};
</script>

<div class="container">
	<h2>Speech Synthesis Demo</h2>
	<input type="text" bind:value={sentence} placeholder="Enter a sentence" disabled={isReading} />
	<button on:click={play} disabled={isReading}>
		{isReading ? 'Reading...' : 'Play'}
	</button>
	{#if currentWord}
		<div class="current-word">
			Currently reading: <strong>{currentWord}</strong>
		</div>
	{/if}
</div>

<style>
	/* Same styles as before */
</style>
