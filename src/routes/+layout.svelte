<script lang="ts">
	import { setContext } from 'svelte';
	import '../app.css';
	import { GazeManager } from 'develex-js-sdk';

	let { children } = $props();

	setContext('gazeManager', new GazeManager());
</script>

<div class="app">
	<main>
		{@render children()}
	</main>
</div>
