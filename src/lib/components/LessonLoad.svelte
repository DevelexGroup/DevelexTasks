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
	import { goto } from '$app/navigation';

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
	let anyError = $derived(
		loadStateViewportCalibration === 'error' ||
			loadStateBridge === 'error' ||
			loadStateTracker === 'error' ||
			loadStateEmitting === 'error'
	);

	$effect(() => {
		if (!showCalibration && calibrationPromiseResolve) {
			calibrationPromiseResolve();
			calibrationPromiseResolve = null;
		}
	});

	const checkViewportCalibration = async () => {
		try {
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
		} catch (error) {
			loadStateViewportCalibration = 'error';
			throw error;
		}
	};

	const connectToBridge = async () => {
		try {
			await waitForTimeout(500);
			/**
			 * @todo: implement once new bridge is ready
			 */
		} catch (error) {
			loadStateBridge = 'error';
			throw error;
		}
	};

	const connectToTracker = async () => {
		try {
			console.log('connectToTracker', gazeManager.input);
			console.log('connectToTracker', gazeManager.windowCalibration);
			await gazeManager.connect();
		} catch (error) {
			loadStateTracker = 'error';
			throw error;
		}
	};

	const startEmitting = async () => {
		try {
			await connectToTracker();
			await gazeManager.start();
		} catch (error) {
			loadStateEmitting = 'error';
			throw error;
		}
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

		await waitForTimeout(400);
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
			<div class="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-2">
				<LessonLoadLine
					loadState={loadStateViewportCalibration}
					loadTitle="Okno prohlížeče zkalibrováno"
				/>
				<LessonLoadLine loadState={loadStateBridge} loadTitle="Připojení Bridge" />
				<LessonLoadLine loadState={loadStateTracker} loadTitle="Nastavení trackeru" />
				<LessonLoadLine loadState={loadStateEmitting} loadTitle="Vysílám pohyby očí" />
				<div class="mt-6 h-32 w-full max-w-md text-red-500">
					{#if anyError}
						<div in:fly={{ duration: 600, y: 200 }}>
							Došlo k chybě při získávání konfigurace lekce. Zkontrolujte své připojení k internetu
							a zkuste to znovu.
						</div>
						<button
							class="mt-4 rounded-md bg-neutral-200 px-4 py-2 text-left text-neutral-600 hover:bg-neutral-300"
							in:fly={{ duration: 600, y: 200, delay: 50 }}
							onclick={() => {
								goto('/');
							}}
						>
							Přejít na hlavní stranu
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
