<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import pkg, { Heatmap } from '@mars3d/heatmap.js';
	const { create } = pkg;

	export interface HeatmapDataPoint {
		x: number;
		y: number;
		value: number;
	}

	export interface HeatmapConfig {
		radius?: number;
		maxOpacity?: number;
		minOpacity?: number;
		blur?: number;
		gradient?: Record<string, string>;
	}

	let {
		data = [],
		config = {},
		class: className = '',
		width = '100%',
		height = '100%'
	}: {
		data?: HeatmapDataPoint[];
		config?: HeatmapConfig;
		class?: string;
		width?: string | number;
		height?: string | number;
	} = $props();

	let containerElement: HTMLDivElement;
	let heatmapInstance = $state<Heatmap<"value", "x", "y"> | null>(null);

	const computedWidth = $derived(typeof width === 'number' ? `${width}px` : width);
	const computedHeight = $derived(typeof height === 'number' ? `${height}px` : height);

	onMount(() => {
		initHeatmap();
	});

	onDestroy(() => {
		// Clean up heatmap instance
		if (heatmapInstance) {
			heatmapInstance = null;
		}
	});

	function initHeatmap() {
		if (!containerElement) return;

		heatmapInstance = create({
			container: containerElement,
			radius: config.radius ?? 40,
			maxOpacity: config.maxOpacity ?? 0.6,
			minOpacity: config.minOpacity ?? 0,
			blur: config.blur ?? 0.75,
			gradient: config.gradient
		});

		updateData();
	}

	function updateData() {
		if (!heatmapInstance || data.length === 0) return;

		const min = Math.min(...data.map((point) => point.value), 0);
		const max = Math.max(...data.map((point) => point.value), 1);

		console.log(heatmapInstance);

		heatmapInstance.setData({
			min,
			max,
			data: data.map((point) => ({
				x: Math.round(point.x),
				y: Math.round(point.y),
				value: point.value
			}))
		});
	}

	// React to data changes
	$effect(() => {
		// Track data dependency
		const currentData = data;
		if (heatmapInstance && currentData) {
			updateData();
		}
	});

	// Track previous config to detect actual changes
	let prevConfigJSON = $state<string | null>(null);

	// React to config changes by reinitializing
	$effect(() => {
		// Track config properties to detect changes
		const currentConfig = JSON.stringify(config);

		// Skip if config hasn't actually changed
		if (prevConfigJSON === currentConfig) return;

		// Skip initial run - onMount handles that
		if (prevConfigJSON === null) {
			prevConfigJSON = currentConfig;
			return;
		}

		prevConfigJSON = currentConfig;

		// heatmap.js doesn't support config updates, so we need to recreate
		// Clear the container first
		if (containerElement) {
			const canvas = containerElement.querySelector('canvas');
			if (canvas) {
				canvas.remove();
			}
		}
		heatmapInstance = null;
		initHeatmap();
	});

	export function getHeatmapInstance() {
		return heatmapInstance;
	}

	export function addDataPoint(point: HeatmapDataPoint) {
		if (heatmapInstance) {
			heatmapInstance.addData({
				x: Math.round(point.x),
				y: Math.round(point.y),
				value: point.value
			});
		}
	}

	export function clearData() {
		if (heatmapInstance) {
			heatmapInstance.setData({ min: 0, max: 1, data: [] });
		}
	}

	export function repaint() {
		if (heatmapInstance) {
			heatmapInstance.repaint();
		}
	}

	export function getDataURL() {
		return heatmapInstance?.getDataURL() ?? null;
	}
</script>

<div
	bind:this={containerElement}
	class="heatmap-container {className}"
	style:width={computedWidth}
	style:height={computedHeight}
	style:position="relative"
></div>

<style>
	.heatmap-container {
		overflow: hidden;
	}

	.heatmap-container :global(canvas) {
		position: absolute;
		top: 0;
		left: 0;
	}
</style>
