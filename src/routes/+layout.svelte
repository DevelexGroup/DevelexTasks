<script lang="ts">
	import { setContext } from 'svelte';
	import '../app.css';
	import { GazeManager } from '@473783/develex-core';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	const gazeManager = new GazeManager();
	setContext('gazeManager', gazeManager);
</script>

<main class="flex h-screen w-screen flex-col items-center justify-center">
	{@render children?.()}
</main>
