<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import Loader from './Loader.svelte';
	import { waitForTimeout } from '$lib/utils/waitForCondition';
	import type { GazeManager } from '@473783/develex-core';

	interface Props {
		onLoad: () => void;
	}

	let { onLoad }: Props = $props();

	const gazeManager = getContext<GazeManager>('gazeManager');

	// multiple loaders, some start with promise from the start,
	// some needs to await for something first
	const viewportCalibrated = new Promise<void>((resolve) => {
		waitForTimeout(500).then(() => resolve());
	});

	const connectedToBridge = new Promise<void>((resolve) => {
		waitForTimeout(500).then(() => resolve());
		/**
		 * @todo: implement once new bridge is ready
		 */
	});

	const connectedToTracker = new Promise<void>(async (resolve) => {
		await connectedToBridge;
		await gazeManager.connect();
		resolve();
	});

	const startedEmitting = new Promise<void>(async (resolve) => {
		await connectedToTracker;
		await gazeManager.start();
		resolve();
	});

	const load = async () => {
		await viewportCalibrated;
		await connectedToBridge;
		await connectedToTracker;
		await startedEmitting;
		await waitForTimeout(500);
		onLoad();
	};

	onMount(load);
</script>

<div class="relative flex h-full w-full flex-col items-center justify-center gap-4">
	<Loader />
</div>
