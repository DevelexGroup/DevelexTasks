<script lang="ts">
	import { onMount, onDestroy, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { fly } from 'svelte/transition';
	import { GazeManager } from '@473783/develex-core';
	import GazeValidate from '$lib/components/validation/GazeValidate.svelte';
	import GazeCheck from '$lib/components/validation/GazeCheck.svelte';
	import { inputCreationConfig } from '$lib/stores/gazeConfig';
	import { get } from 'svelte/store';
	import { waitForTimeout } from '$lib/utils/waitForCondition';
	import LessonLoadViewportCalibration from '$lib/components/LessonLoadViewportCalibration.svelte';
	import LessonLoadLine from '$lib/components/LessonLoadLine.svelte';
	import { goto } from '$app/navigation';
	import { extractErrorMessage } from '$lib/utils/errorUtility';

	const gazeManager = new GazeManager();
	setContext('gazeManager', gazeManager);

	const generateUniqueId = () => `session-${Date.now()}`;
	const sessionId = generateUniqueId();
	setContext('sessionId', sessionId);

	let showCalibration = $state(false);
	let calibrationPromiseResolve: (() => void) | null = $state(null);
	let loadStateViewportCalibration = $state<'loading' | 'loaded' | 'error'>('loading');
	let loadStateBridge = $state<'loading' | 'loaded' | 'error'>('loading');
	let loadStateTracker = $state<'loading' | 'loaded' | 'error'>('loading');
	let loadStateEmitting = $state<'loading' | 'loaded' | 'error'>('loading');
	let appState = $state<'loading' | 'ready' | 'results'>('loading');
	let errorMessage = $state('');

	type GazeValidationMetrics = {
		accuracy: number;
		precision: number;
		gazePointCount: number;
	};

	type GazeValidationResult = {
		topleft: GazeValidationMetrics;
		middle: GazeValidationMetrics;
		bottomright: GazeValidationMetrics;
		topright: GazeValidationMetrics;
		topmiddle: GazeValidationMetrics;
	};

	// Store validation results
	let validationResults = $state<GazeValidationResult>({
		topleft: { accuracy: 0, precision: 0, gazePointCount: 0 },
		middle: { accuracy: 0, precision: 0, gazePointCount: 0 },
		bottomright: { accuracy: 0, precision: 0, gazePointCount: 0 },
		topright: { accuracy: 0, precision: 0, gazePointCount: 0 },
		topmiddle: { accuracy: 0, precision: 0, gazePointCount: 0 }
	});

	const anyError = $derived(
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

	function handleValidatedPoint(result: {
		where: 'topleft' | 'middle' | 'bottomright' | 'topright' | 'topmiddle';
		accuracy: number;
		precision: number;
		gazePointCount: number;
		gazeDataPoints: unknown[];
	}) {
		console.log('Validation point:', result);
		// Save the result to our validation results
		validationResults[result.where] = {
			accuracy: result.accuracy,
			precision: result.precision,
			gazePointCount: result.gazePointCount
		};
	}

	function handleValidated() {
		console.log('Validation completed');
		appState = 'results';
	}

	function handleValidateAgain() {
		appState = 'ready';
	}

	function handleContinue() {
		goto('/');
	}

	const checkViewportCalibration = async () => {
		try {
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
			errorMessage = extractErrorMessage(
				error,
				'Nepodařilo se nakalibrovat okno prohlížeče',
				'Neznámá chyba při získání kalibrační rovnice'
			);
			loadStateViewportCalibration = 'error';
			throw error;
		}
	};

	const connectToBridge = async () => {
		try {
			await waitForTimeout(400);
			await gazeManager.open();
			loadStateBridge = 'loaded';
		} catch (error) {
			errorMessage = extractErrorMessage(
				error,
				'Nepodařilo se připojit k Bridge',
				'Neznámá chyba při připojení k Bridge'
			);
			loadStateBridge = 'error';
			throw error;
		}
	};

	const connectToTracker = async () => {
		try {
			await gazeManager.connect();
			loadStateTracker = 'loaded';
		} catch (error) {
			errorMessage = extractErrorMessage(
				error,
				'Nepodařilo se připojit k trackeru',
				'Neznámá chyba při připojení k trackeru'
			);
			loadStateTracker = 'error';
			throw error;
		}
	};

	const startEmitting = async () => {
		try {
			const manager = await gazeManager.status();
			if (manager.lastStatus?.tracker.status !== 'trackerEmitting') {
				await gazeManager.start();
			}
			loadStateEmitting = 'loaded';
		} catch (error) {
			errorMessage = extractErrorMessage(
				error,
				'Nepodařilo se začít vysílat pohyby očí',
				'Neznámá chyba při pokusu o vysílání pohybů očí'
			);
			loadStateEmitting = 'error';
			throw error;
		}
	};

	const initialize = async () => {
		try {
			await checkViewportCalibration();
			loadStateViewportCalibration = 'loaded';

			await connectToBridge();
			await connectToTracker();
			await startEmitting();

			await waitForTimeout(600);
			appState = 'ready';
		} catch (error) {
			console.error('Initialization error:', error);
		}
	};

	onMount(() => {
		initialize();
	});

	onDestroy(() => {
		if (gazeManager.input) {
			gazeManager.stop();
			gazeManager.disconnect();
			gazeManager.close();
		}
	});
</script>

<div class="relative flex h-screen w-screen items-center justify-center overflow-hidden">
	{#if showCalibration}
		<div transition:fly={{ duration: 300, y: -200 }} class="absolute inset-0 left-0 top-0">
			<LessonLoadViewportCalibration onCalibrated={() => (showCalibration = false)} />
		</div>
	{:else if appState === 'loading'}
		<div
			transition:fly={{ duration: 300, y: 200 }}
			class="absolute inset-0 left-0 top-0 flex flex-col items-center justify-center gap-2"
		>
			<div class="mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-2">
				<h1 class="mb-4 w-full text-left text-2xl font-bold text-neutral-600">
					Načítání validačního systému
				</h1>
				<LessonLoadLine
					loadState={loadStateViewportCalibration}
					loadTitle="Okno prohlížeče kalibrováno"
				/>
				<LessonLoadLine loadState={loadStateBridge} loadTitle="Připojení Bridge" />
				<LessonLoadLine loadState={loadStateTracker} loadTitle="Nastavení trackeru" />
				<LessonLoadLine loadState={loadStateEmitting} loadTitle="Emise dat" />
				<div class="mt-6 h-24 w-full max-w-sm text-red-500">
					{#if anyError}
						<div in:fly={{ duration: 600, y: 200 }}>
							{errorMessage}
						</div>
						<button
							class="mt-4 rounded-md bg-neutral-200 px-4 py-2 text-left text-neutral-600 hover:bg-neutral-300"
							in:fly={{ duration: 600, y: 200, delay: 50 }}
							onclick={() => {
								goto('/');
							}}
						>
							Přejít na hlavní stránku
						</button>
					{/if}
				</div>
			</div>
		</div>
	{:else if appState === 'ready'}
		<div
			in:fly={{ y: 100, duration: 750, opacity: 0, delay: 500 }}
			class="flex h-full w-full flex-col items-center justify-center p-12"
		>
			<GazeValidate
				{gazeManager}
				onValidatedPoint={handleValidatedPoint}
				onValidated={handleValidated}
			/>
		</div>
	{:else if appState === 'results'}
		<div
			in:fly={{ y: 100, duration: 750, opacity: 0, delay: 500 }}
			class="flex h-full w-full flex-col items-center justify-center p-12"
		>
			<GazeCheck
				{gazeManager}
				results={validationResults}
				onValidate={handleValidateAgain}
				onContinue={handleContinue}
			/>
		</div>
	{/if}
</div>
