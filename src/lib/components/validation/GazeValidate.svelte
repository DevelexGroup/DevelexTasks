<script lang="ts">
	import type { GazeManager, GazeInteractionObjectValidationSettings } from '@473783/develex-core';
	import GazeValidateCross from './GazeValidateCross.svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		gazeManager: GazeManager;
		onValidatedPoint: ({
			where,
			accuracy,
			precision,
			gazePointCount,
			gazeDataPoints
		}: {
			where: 'topleft' | 'middle' | 'bottomright' | 'topright' | 'topmiddle';
			accuracy: number;
			precision: number;
			gazePointCount: number;
			gazeDataPoints: unknown[];
		}) => void;
		onValidated: () => void;
	}

	const { gazeManager, onValidatedPoint, onValidated }: Props = $props();

	let stage: 'topleft' | 'middle' | 'bottomright' | 'topright' | 'topmiddle' = $state('topleft');

	const results = {
		topleft: {
			accuracy: 999,
			precision: 999,
			gazePointCount: 0
		},
		middle: {
			accuracy: 999,
			precision: 999,
			gazePointCount: 0
		},
		bottomright: {
			accuracy: 999,
			precision: 999,
			gazePointCount: 0
		},
		topright: {
			accuracy: 999,
			precision: 999,
			gazePointCount: 0
		},
		topmiddle: {
			accuracy: 999,
			precision: 999,
			gazePointCount: 0
		}
	};

	const validationSettings: Partial<GazeInteractionObjectValidationSettings> & {
		validationDuration: number;
	} = {
		validationDuration: 1000,
		onValidation: (result) => {
			if (stage === 'topleft') {
				saveResult('topleft', result);
				stage = 'middle';
			} else if (stage === 'middle') {
				saveResult('middle', result);
				stage = 'bottomright';
			} else if (stage === 'bottomright') {
				saveResult('bottomright', result);
				stage = 'topright';
			} else if (stage === 'topright') {
				saveResult('topright', result);
				stage = 'topmiddle';
			} else if (stage === 'topmiddle') {
				saveResult('topmiddle', result);
				onValidated();
			}
		}
	};

	const saveResult = (
		where: 'topleft' | 'middle' | 'bottomright' | 'topright' | 'topmiddle',
		result: { accuracy: number; precision: number; gazeDataPoints: unknown[] }
	) => {
		results[where].accuracy = result.accuracy;
		results[where].precision = result.precision;
		results[where].gazePointCount = result.gazeDataPoints.length;
		onValidatedPoint({
			where,
			accuracy: result.accuracy,
			precision: result.precision,
			gazePointCount: result.gazeDataPoints.length,
			gazeDataPoints: result.gazeDataPoints
		});
	};
</script>

<div class="relative h-full min-h-60 w-full overflow-visible p-8">
	<!-- TOPLEFT -->
	{#if stage === 'topleft'}
		<div class="absolute left-0 top-0" transition:fade>
			<GazeValidateCross
				{gazeManager}
				{validationSettings}
				aoi="crossfix-mt-1"
				animation="smaller"
				color="red"
			/>
		</div>
	{:else if stage === 'middle'}
		<!-- MIDDLE -->
		<div
			class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform"
			transition:fade
		>
			<GazeValidateCross
				{gazeManager}
				{validationSettings}
				aoi="crossfix-mt-2"
				animation="smaller"
				color="red"
			/>
		</div>
	{:else if stage === 'bottomright'}
		<!-- BOTTOMRIGHT -->
		<div class="absolute bottom-0 right-0" transition:fade>
			<GazeValidateCross
				{gazeManager}
				{validationSettings}
				aoi="crossfix-mt-3"
				animation="smaller"
				color="red"
			/>
		</div>
	{:else if stage === 'topright'}
		<!-- TOP RIGHT -->
		<div class="absolute right-0 top-0" transition:fade>
			<GazeValidateCross
				{gazeManager}
				{validationSettings}
				aoi="crossfix-mt-5"
				animation="smaller"
				color="red"
			/>
		</div>
	{:else if stage === 'topmiddle'}
		<!-- TOP MIDDLE -->
		<div class="absolute left-1/2 top-0 -translate-x-1/2 transform" transition:fade>
			<GazeValidateCross
				{gazeManager}
				{validationSettings}
				aoi="crossfix-mt-6"
				animation="smaller"
				color="red"
			/>
		</div>
	{/if}
</div>
