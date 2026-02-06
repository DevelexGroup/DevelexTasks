<script lang="ts">
	import { onDestroy, onMount, setContext } from 'svelte';
	import '../app.css';
	import { GazeManager } from 'develex-js-sdk';
	import { cursorVisible } from '$lib/stores/cursor';
	import { KeyboardManager } from '$lib/utils/keyboardManager';
	import { AnalyticsManager } from '$lib/utils/analyticsManager';
	import {
		ANALYTICS_MANAGER_KEY,
		GAZE_MANAGER_KEY,
		KEYBOARD_MANAGER_KEY
	} from '$lib/types/general.types';
	import DebugWindow from '$lib/components/DebugWindow.svelte';

	let { children } = $props();

	const gazeManager = new GazeManager();
	setContext(GAZE_MANAGER_KEY, gazeManager);

	const keyboardManager = new KeyboardManager();
	setContext(KEYBOARD_MANAGER_KEY, keyboardManager);

	const analyticsManager = new AnalyticsManager(gazeManager);
	setContext(ANALYTICS_MANAGER_KEY, analyticsManager);

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
	<DebugWindow />
</div>

<style>
	.cursor-hidden {
		cursor: none;
	}
</style>
