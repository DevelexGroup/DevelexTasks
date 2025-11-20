<script lang="ts">
	import { onDestroy, onMount, setContext } from 'svelte';
	import '../app.css';
	import { GazeManager } from 'develex-js-sdk';
	import { cursorVisible } from '$lib/stores/cursor'

	let { children } = $props();

	setContext('gazeManager', new GazeManager());

	onMount(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				cursorVisible.set(true);
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		onDestroy(() => {
			window.removeEventListener('keydown', handleKeyDown);
		});
	});
</script>

<div class="app" class:cursor-hidden={!$cursorVisible}>
	<main>
		{@render children()}
	</main>
</div>

<style>
	.cursor-hidden{
			cursor: none;
	}
</style>
