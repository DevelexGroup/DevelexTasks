<script lang="ts">
	import { onDestroy, onMount, setContext } from 'svelte';
	import '../app.css';
	import { GazeManager } from 'develex-js-sdk';
	import { cursorVisible } from '$lib/stores/cursor'
	import { KeyboardManager } from '$lib/utils/keyboardManager';

	let { children } = $props();

	setContext('gazeManager', new GazeManager());

	const keyboardManager = new KeyboardManager();
	setContext('keyboardManager', keyboardManager);

	onMount(() => {
		let escEvt = keyboardManager.onKeyDown('Escape', () => {
			cursorVisible.set(true);
		});

		return () => {
			escEvt.dispose();
		};
	});

	onDestroy(() => {
		keyboardManager.disposeAll();
	});
</script>

<svelte:window
	on:keydown={keyboardManager.dispatchOnKeyDown}
	on:keyup={keyboardManager.dispatchOnKeyUp}
/>

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
