<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import '../app.css';
	import { GazeManager } from '@473783/develex-core';
	import { inputCreationConfig } from '$lib/stores/gazeConfig';
	import { get } from 'svelte/store';
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
