<script lang="ts">
	import { untrack } from 'svelte';
	import pkg from '@mars3d/heatmap.js';
	import type { Heatmap } from '@mars3d/heatmap.js';

	const { create } = pkg;

	export interface HeatmapPoint {
		x: number;
		y: number;
		value: number;
	}

	export interface HeatmapConfig {
		radius: number;
		maxOpacity: number;
		minOpacity: number;
		blur: number;
	}

	interface Props {
		data: HeatmapPoint[];
		/** Accumulated value at which the gradient saturates. */
		max: number;
		width: number;
		height: number;
		config: HeatmapConfig;
	}

	let { data, max, width, height, config }: Props = $props();

	interface RenderPoint extends HeatmapPoint {
		radius: number;
	}

	let container = $state<HTMLDivElement | null>(null);
	let instance: Heatmap<'value', 'x', 'y'> | null = null;

	// heatmap.js fixes each point's radius when the data is set; configure() cannot change it later.
	function render() {
		const points: RenderPoint[] = data.map((point) => ({
			x: Math.round(point.x),
			y: Math.round(point.y),
			value: point.value,
			radius: config.radius
		}));
		instance?.setData({ min: 0, max, data: points });
	}

	// The canvas takes its size from the container once, so a size change recreates it.
	$effect(() => {
		const node = container;
		void width;
		void height;
		if (!node) return;
		instance = create({ container: node, ...untrack(() => config) });
		untrack(render);
		return () => {
			node.querySelector('canvas')?.remove();
			instance = null;
		};
	});

	$effect(() => {
		const node = container;
		const next = { ...config };
		if (!node) return;
		untrack(() => instance?.configure({ container: node, ...next }));
	});

	$effect(() => {
		render();
	});
</script>

<div
	bind:this={container}
	class="absolute inset-0 overflow-hidden"
	style="width: {width}px; height: {height}px;"
></div>

<style>
	div :global(canvas) {
		position: absolute;
		top: 0;
		left: 0;
	}
</style>
