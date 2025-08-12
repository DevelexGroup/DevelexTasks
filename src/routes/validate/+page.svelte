<script lang="ts">
	import { onMount, onDestroy, setContext } from 'svelte';
	import { fly } from 'svelte/transition';
	import { GazeManager } from 'develex-js-sdk';
	import type { GazeDataPoint, FixationDataPoint } from 'develex-js-sdk';
	import GazeValidate from '$lib/components/validation/GazeValidate.svelte';
	import GazeCheck from '$lib/components/validation/GazeCheck.svelte';
	import { inputCreationConfig } from '$lib/stores/gazeConfig';
	import { get } from 'svelte/store';
	import { waitForTimeout } from '$lib/utils/waitForCondition';
	import LessonLoadViewportCalibration from '$lib/components/LessonLoadViewportCalibration.svelte';
	import LessonLoadLine from '$lib/components/LessonLoadLine.svelte';
	import { goto } from '$app/navigation';
	import { extractErrorMessage } from '$lib/utils/errorUtility';
	import sessionRepository from '$lib/database/repositories/session.repository';
	import validationPointRepository from '$lib/database/repositories/validationPoint.repository';
	import stateEventsRepository from '$lib/database/repositories/stateEvents.repository';
	import gazeInputRepository from '$lib/database/repositories/gazeInput.repository';
	import fixationInputRepository from '$lib/database/repositories/fixationInput.repository';

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

	const handleInputData = async (inputData: GazeDataPoint) => {
		console.log('inputData', inputData);
		const clientTimestamp = new Date().toISOString();
		await gazeInputRepository.create({ ...inputData, sessionId, clientTimestamp });
	};

	const handleInputFixationStart = async (inputFixationStart: FixationDataPoint) => {
		console.log('inputFixationStart', inputFixationStart);
		const clientTimestamp = new Date().toISOString();
		await fixationInputRepository.create({ ...inputFixationStart, sessionId, clientTimestamp });
	};

	async function handleValidatedPoint(result: {
		where: 'topleft' | 'middle' | 'bottomright' | 'topright' | 'topmiddle';
		accuracy: number;
		precision: number;
		gazePointCount: number;
		gazeDataPoints: GazeDataPoint[];
	}) {
		console.log('Validation point:', result);
		// Save the result to our validation results
		validationResults[result.where] = {
			accuracy: result.accuracy,
			precision: result.precision,
			gazePointCount: result.gazePointCount
		};

		// First save all individual gazeDataPoints
		const gazePointIds: string[] = result.gazeDataPoints.map((gazePoint) => gazePoint.deviceId);
		const timestamp = new Date().toISOString();

		// Save validation point to IndexedDB with references to the gaze points
		await validationPointRepository.create({
			sessionId,
			timestamp,
			where: result.where,
			accuracy: result.accuracy,
			precision: result.precision,
			gazePointCount: result.gazePointCount,
			gazePointIds: `[${gazePointIds.join(',')}]` // to prevent interpreting in excel as a big number
		});

		// Log state event
		await stateEventsRepository.create({
			sessionId,
			timestamp: Date.now(),
			type: 'validationPoint',
			data: `${result.where}: accuracy=${result.accuracy}, precision=${result.precision}, points=${result.gazePointCount}`
		});
	}

	async function handleValidated() {
		console.log('Validation completed');

		// Log state event
		await stateEventsRepository.create({
			sessionId,
			timestamp: Date.now(),
			type: 'validationComplete',
			data: 'All validation points completed'
		});

		appState = 'results';
	}

	async function handleValidateAgain() {
		await stateEventsRepository.create({
			sessionId,
			timestamp: Date.now(),
			type: 'validationRestart',
			data: 'User chose to validate again'
		});

		appState = 'ready';
	}

	async function handleContinue() {
		await stateEventsRepository.create({
			sessionId,
			timestamp: Date.now(),
			type: 'validationEnd',
			data: 'User completed validation'
		});

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
			// Create session record
			await sessionRepository.create({
				id: sessionId,
				name: `Validation session ${new Date().toLocaleString('cs-CZ')}`,
				userName: 'NoSpecificUser'
			});

			// Log session start
			await stateEventsRepository.create({
				sessionId,
				timestamp: Date.now(), // this one is timestamp in milliseconds for ordering reasons later on
				type: 'validationStart',
				data: 'Validation session started'
			});

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
		gazeManager.on('inputData', handleInputData);
		gazeManager.on('inputFixationStart', handleInputFixationStart);
		initialize();
	});

	onDestroy(() => {
		if (gazeManager.input) {
			gazeManager.stop();
			gazeManager.disconnect();
			gazeManager.close();
		}

		// Remove event handlers
		gazeManager.off('inputData', handleInputData);
		gazeManager.off('inputFixationStart', handleInputFixationStart);
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
