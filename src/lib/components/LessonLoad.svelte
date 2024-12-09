<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import Loader from './Loader.svelte';
	import LessonLoadViewportCalibration from './LessonLoadViewportCalibration.svelte';
	import { waitForTimeout } from '$lib/utils/waitForCondition';
	import type { GazeManager } from '@473783/develex-core';
	import type { LessonConfig } from '$lib/types/lesson';
	import { inputCreationConfig } from '$lib/stores/gazeConfig';
	import { get } from 'svelte/store';
	import { fly } from 'svelte/transition';
	import LessonLoadLine from './LessonLoadLine.svelte';

	interface Props {
		getLessonConfig: () => Promise<LessonConfig['setup']>;
		onLoad: (lessonConfig: LessonConfig['setup']) => void;
	}

	let { getLessonConfig, onLoad }: Props = $props();
	let showCalibration = $state(false);

	const gazeManager = getContext<GazeManager>('gazeManager');

	let calibrationPromiseResolve: (() => void) | null = $state(null);
	let loadStateViewportCalibration = $state<'loading' | 'loaded' | 'error'>('loading');
	let loadStateBridge = $state<'loading' | 'loaded' | 'error'>('loading');
	let loadStateTracker = $state<'loading' | 'loaded' | 'error'>('loading');
	let loadStateEmitting = $state<'loading' | 'loaded' | 'error'>('loading');

	$effect(() => {
		if (!showCalibration && calibrationPromiseResolve) {
			calibrationPromiseResolve();
			calibrationPromiseResolve = null;
		}
	});

	const checkViewportCalibration = async () => {
		// Create input only if it doesn't exist
		if (!gazeManager.input) {
			const inputConfig = get(inputCreationConfig);
			gazeManager.createInput(inputConfig);
		}
		if (!gazeManager.windowCalibration) {
			showCalibration = true;
			return new Promise<void>((resolve) => {
				calibrationPromiseResolve = resolve;
			});
		}
	};

	const connectToBridge = async () => {
		await waitForTimeout(500);
		/**
		 * @todo: implement once new bridge is ready
		 */
	};

	const connectToTracker = async () => {
		console.log('connectToTracker', gazeManager.input);
		console.log('connectToTracker', gazeManager.windowCalibration);
		await gazeManager.connect();
	};

	const startEmitting = async () => {
		await connectToTracker();
		await gazeManager.start();
	};

	const load = async () => {
		console.log('load the lesson config');
		const lessonConfig = await getLessonConfig();
		await checkViewportCalibration();
		loadStateViewportCalibration = 'loaded';

		await connectToBridge();
		loadStateBridge = 'loaded';

		await connectToTracker();
		loadStateTracker = 'loaded';

		await startEmitting();
		loadStateEmitting = 'loaded';
		onLoad(lessonConfig);
	};

	onMount(load);
</script>

<div class="relative flex h-full w-full flex-col items-center justify-center gap-4">
	{#if showCalibration}
		<div transition:fly={{ duration: 300, y: -200 }} class="absolute inset-0 left-0 top-0">
			<LessonLoadViewportCalibration onCalibrated={() => (showCalibration = false)} />
		</div>
	{:else}
		<div
			transition:fly={{ duration: 300, y: 200 }}
			class="absolute inset-0 left-0 top-0 flex flex-col items-center justify-center gap-2"
		>
			<div class="mx-auto flex flex-col items-center justify-center gap-2">
				<LessonLoadLine
					loadState={loadStateViewportCalibration}
					loadTitle="Okno prohlížeče zkalibrováno"
				/>
				<LessonLoadLine loadState={loadStateBridge} loadTitle="Připojení Bridge" />
				<LessonLoadLine loadState={loadStateTracker} loadTitle="Nastavení trackeru" />
				<LessonLoadLine loadState={loadStateEmitting} loadTitle="Vysílám pohyby očí" />
			</div>
		</div>
	{/if}
</div>
