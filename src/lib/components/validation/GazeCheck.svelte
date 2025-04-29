<script lang="ts">
	import type { GazeManager } from '@473783/develex-core';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';

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

	interface Props {
		gazeManager: GazeManager;
		results: GazeValidationResult;
		onValidate: () => void;
		onContinue: () => void;
	}

	const { gazeManager, results, onValidate, onContinue }: Props = $props();

	type LocaleKeys =
		| 'place'
		| 'accuracy'
		| 'precision'
		| 'gazePointCount'
		| 'topleft'
		| 'middle'
		| 'bottomright'
		| 'topright'
		| 'topmiddle'
		| 'average'
		| 'continue'
		| 'validate'
		| 'calibrate';

	const locale: Record<LocaleKeys, string> = {
		place: 'Místo validace',
		accuracy: 'Správnost [px]',
		precision: 'Konzistence [px]',
		gazePointCount: 'Počet datových bodů',
		topleft: 'Levý horní roh',
		middle: 'Střed',
		bottomright: 'Pravý dolní roh',
		topright: 'Pravý horní roh',
		topmiddle: 'Střed nahoře',
		average: 'Průměr',
		continue: 'Pokračovat',
		validate: 'Znovu validovat',
		calibrate: 'Spustit kalibraci'
	};

	const validationResultArray = $derived(
		Object.entries(results) as [
			'topleft' | 'middle' | 'bottomright' | 'topright' | 'topmiddle',
			GazeValidationResult[keyof GazeValidationResult]
		][]
	);

	const handleAction = (action: 'continue' | 'validate' | 'calibrate') => {
		if (action === 'calibrate') {
			gazeManager.calibrate();
		} else if (action === 'validate') {
			onValidate();
		} else if (action === 'continue') {
			onContinue();
		}
	};

	const roundToTwo = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

	const calculateAverage = (key: keyof GazeValidationMetrics) => {
		if (!results) return 0;
		const sum = Object.values(results).reduce((acc, metrics) => acc + metrics[key], 0);
		return roundToTwo(sum / Object.keys(results).length);
	};

	onMount(() => gazeManager.stop());
	onDestroy(() => gazeManager.start());

	// Configuration for thresholds and conditions
	const metricConfig = {
		accuracy: { threshold: 100, condition: '>' }, // accuracy critical if > 50
		precision: { threshold: 50, condition: '>' }, // precision critical if > 50
		gazePointCount: { threshold: 120, condition: '<' } // gazePointCount critical if < 20
	};

	const isMetricCritical = (metricValue: number, metricType: keyof typeof metricConfig) => {
		const { threshold, condition } = metricConfig[metricType];
		// Check if the condition matches based on the configuration
		return condition === '>' ? metricValue > threshold : metricValue < threshold;
	};

	// SVG paths for icons
	const iconPaths = {
		arrowRight:
			'M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z',
		eye: 'M10 12a2 2 0 100-4 2 2 0 000 4z M10 4C5.68 4 2.1 7.04 1 11c1.1 3.96 4.68 7 9 7s7.9-3.04 9-7c-1.1-3.96-4.68-7-9-7zm0 12c-3.18 0-5.9-2.14-7-5 1.1-2.86 3.82-5 7-5s5.9 2.14 7 5c-1.1 2.86-3.82 5-7 5z',
		undo: 'M8.293 12.707a1 1 0 101.414-1.414L7.414 9H13a6 6 0 16 6v1a1 1 0 102 0v-1a8 8 0 00-8-8H7.414l2.293-2.293a1 1 0 00-1.414-1.414l-4 4a1 1 0 000 1.414l4 4z'
	};
</script>

<div class="flex flex-col items-center justify-center gap-4">
	<div class="w-full overflow-x-auto">
		<table class="w-full text-left text-sm text-gray-500">
			<thead class="bg-gray-50 text-xs uppercase text-gray-700">
				<tr>
					<th scope="col" class="px-6 py-3">{locale.place}</th>
					<th scope="col" class="px-6 py-3">{locale.accuracy}</th>
					<th scope="col" class="px-6 py-3">{locale.precision}</th>
					<th scope="col" class="px-6 py-3">{locale.gazePointCount}</th>
				</tr>
			</thead>
			<tbody>
				{#if results}
					{#each validationResultArray as [position, metrics]}
						<tr class="border-b bg-white">
							<td class="px-6 py-4">{locale[position]}</td>
							<td
								class="px-6 py-4 {isMetricCritical(metrics.accuracy, 'accuracy')
									? 'bg-red-100'
									: 'bg-green-100'}"
							>
								{roundToTwo(metrics.accuracy)}
							</td>
							<td
								class="px-6 py-4 {isMetricCritical(metrics.precision, 'precision')
									? 'bg-red-100'
									: 'bg-green-100'}"
							>
								{roundToTwo(metrics.precision)}
							</td>
							<td
								class="px-6 py-4 {isMetricCritical(metrics.gazePointCount, 'gazePointCount')
									? 'bg-red-100'
									: 'bg-green-100'}"
							>
								{metrics.gazePointCount}
							</td>
						</tr>
					{/each}
					<tr class="border-b bg-white font-medium">
						<td class="px-6 py-4">{locale.average}</td>
						<td class="px-6 py-4">{calculateAverage('accuracy')}</td>
						<td class="px-6 py-4">{calculateAverage('precision')}</td>
						<td class="px-6 py-4">{calculateAverage('gazePointCount')}</td>
					</tr>
				{:else}
					<tr class="border-b bg-white">
						<td class="px-6 py-4">Loading...</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Button Section -->
	<div class="flex gap-1">
		<button
			class="flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300"
			onclick={() => handleAction('validate')}
		>
			<svg
				class="me-3 h-4 w-4"
				fill="currentColor"
				viewBox="0 0 20 20"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path d={iconPaths.undo}></path>
			</svg>
			{locale.validate}
		</button>
		<button
			class="flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300"
			onclick={() => handleAction('calibrate')}
		>
			<svg
				class="me-3 h-4 w-4"
				fill="currentColor"
				viewBox="0 0 20 20"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path d={iconPaths.eye}></path>
			</svg>
			{locale.calibrate}
		</button>
		<button
			class="flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300"
			onclick={() => handleAction('continue')}
		>
			<svg
				class="me-3 h-4 w-4"
				fill="currentColor"
				viewBox="0 0 20 20"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path d={iconPaths.arrowRight}></path>
			</svg>
			{locale.continue}
		</button>
	</div>
</div>
