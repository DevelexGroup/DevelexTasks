<script lang="ts">
	import { GAZE_INPUT_CONFIGS, trackerConfig } from '$lib/stores/tracker';
	import { GAZE_MANAGER_KEY, LoadState } from '$lib/types/general.types';
	import { extractError } from '$lib/utils/error';
	import { waitForStoreCondition, waitForTimeout } from '$lib/utils/waitFor';
	import { type GazeManager } from 'develex-js-sdk';
	import { getContext, onMount } from 'svelte';
	import { get, writable } from 'svelte/store';
	import { fade, fly } from 'svelte/transition';
	import TaskViewportCalibration from './TaskViewportCalibration.svelte';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';

	interface Props {
		onCompleted: () => void;
	}

	let { onCompleted }: Props = $props();

	const gazeManager = getContext<GazeManager>(GAZE_MANAGER_KEY);

	let showCalibration = writable(false);
	let errorMessage = $state('');

	let viewportCalibrationState = $state(LoadState.Loading);
	let bridgeState = $state(LoadState.Loading);
	let trackerState = $state(LoadState.Loading);
	let emittingState = $state(LoadState.Loading);

	const handleViewportCalibration = async (): Promise<boolean> => {
		try {
			gazeManager.createInput(GAZE_INPUT_CONFIGS[get(trackerConfig)]);

			if (!gazeManager.windowCalibration) {
				showCalibration.set(true);

				await waitForStoreCondition(showCalibration, (v) => v === false);

				viewportCalibrationState = LoadState.Loaded;
			}
			return true;
		} catch (error) {
			errorMessage = extractError(error, 'nepodařilo se nakalibrovat okno prohlížeče');
			viewportCalibrationState = LoadState.Error;
			return false;
		}
	};

	const handleBridgeInitialization = async (): Promise<boolean> => {
		try {
			await waitForTimeout(400);
			await gazeManager.open();

			bridgeState = LoadState.Loaded;
			return true;
		} catch (error) {
			errorMessage = extractError(error, 'nepodařilo se inicializovat spojení s bridgem');
			bridgeState = LoadState.Error;
			return false;
		}
	};

	const handleTrackerConnection = async (): Promise<boolean> => {
		try {
			await gazeManager.connect();

			trackerState = LoadState.Loaded;
			return true;
		} catch (error) {
			errorMessage = extractError(error, 'nepodařilo se připojit ke trackeru');
			trackerState = LoadState.Error;
			return false;
		}
	};

	const handleEmittingStart = async (): Promise<boolean> => {
		try {
			const status = await gazeManager.status();

			if (status.lastStatus?.tracker.status !== 'trackerEmitting') {
				await gazeManager.start();
			}

			emittingState = LoadState.Loaded;
			return true;
		} catch (error) {
			errorMessage = extractError(error, 'nepodařilo se spustit odesílání dat z trackeru');
			emittingState = LoadState.Error;
			return false;
		}
	};

	const markRemainingAsSkipped = (fromStep: number) => {
		const states = [
			(v: LoadState) => (viewportCalibrationState = v),
			(v: LoadState) => (bridgeState = v),
			(v: LoadState) => (trackerState = v),
			(v: LoadState) => (emittingState = v)
		];
		for (let i = fromStep; i < states.length; i++) {
			states[i](LoadState.Skipped);
		}
	};

	onMount(async () => {
		if (!(await handleViewportCalibration())) {
			markRemainingAsSkipped(1);
			return;
		}
		if (!(await handleBridgeInitialization())) {
			markRemainingAsSkipped(2);
			return;
		}
		if (!(await handleTrackerConnection())) {
			markRemainingAsSkipped(3);
			return;
		}
		if (!(await handleEmittingStart())) {
			return;
		}
		await waitForTimeout(500);

		onCompleted();
	});
</script>

{#snippet loadItem(state: LoadState, title: string)}
	<div class="flex items-center justify-start gap-4">
		{#if state == LoadState.Loading}
			<div
				class="inline-flex h-12 w-12 items-center justify-center rounded-md border border-blue-700/10 bg-blue-50"
			>
				<Icon icon="line-md:loading-twotone-loop" class="h-7 w-7 text-blue-700" />
			</div>
		{:else if state == LoadState.Loaded}
			<div
				class="inline-flex h-12 w-12 items-center justify-center rounded-md border border-green-600/10 bg-green-50"
			>
				<Icon icon="material-symbols:check-rounded" class="h-7 w-7 text-green-600" />
			</div>
		{:else if state == LoadState.Error}
			<div
				class="inline-flex h-12 w-12 items-center justify-center rounded-md border border-red-600/10 bg-red-50"
			>
				<Icon icon="heroicons:x-mark" class="h-7 w-7 text-red-600" />
			</div>
		{:else if state == LoadState.Skipped}
			<div
				class="inline-flex h-12 w-12 items-center justify-center rounded-md border border-gray-400/10 bg-gray-100"
			>
				<Icon icon="heroicons:minus" class="h-7 w-7 text-gray-400" />
			</div>
		{/if}

		<span class="text-lg text-gray-800">{title}</span>
	</div>
{/snippet}

<div
	class="relative flex h-screen w-full flex-col items-center justify-center gap-4 overflow-hidden"
>
	{#if $showCalibration}
		<div transition:fly={{ duration: 300, y: -200 }} class="absolute inset-0 top-0 left-0">
			<TaskViewportCalibration onCalibrated={() => showCalibration.set(false)} />
		</div>
	{:else}
		<div
			transition:fly={{ duration: 300, y: 200 }}
			class="absolute inset-0 top-0 left-0 flex flex-col items-center justify-center gap-2"
		>
			<div class="mx-auto flex w-full max-w-sm flex-col items-start justify-center gap-2">
				<h1 class="mb-4 w-full text-left text-2xl font-bold text-neutral-600">Nahrávám lekci</h1>

				{@render loadItem(viewportCalibrationState, 'Okno prohlížeče zkalibrováno')}
				{@render loadItem(bridgeState, 'Připojení Bridge')}
				{@render loadItem(trackerState, 'Nastavení trackeru')}
				{@render loadItem(emittingState, 'Vysílám pohyby očí')}

				<div class="mt-6 w-full max-w-sm text-red-500">
					{#if viewportCalibrationState === LoadState.Error || bridgeState === LoadState.Error || trackerState === LoadState.Error || emittingState === LoadState.Error}
						<div in:fade class="rounded-md border border-red-700/10 bg-red-50 p-2">
							{errorMessage}
						</div>

						<div class="mt-4 flex gap-2" in:fly={{ duration: 600, y: 200, delay: 50 }}>
							<button
								class="rounded-md bg-neutral-200 px-4 py-2 text-center text-neutral-600 hover:bg-neutral-300"
								onclick={() => {
									goto('/');
								}}
							>
								Přejít na hlavní stranu
							</button>
							<button
								class="rounded-md bg-amber-100 px-4 py-2 text-center text-amber-700 hover:bg-amber-200 flex-grow-1"
								onclick={() => {
									onCompleted();
								}}
							>
								Pokračovat<br><small>(může být nefunkční)</small>
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
