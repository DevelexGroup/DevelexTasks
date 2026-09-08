<script lang="ts">
	import type { FixationDataEntry } from '$lib/database/db.types';
	import type { AoiRect } from '$lib/utils/sessionSim/types';

	export interface GazePoint {
		x: number;
		y: number;
	}

	export interface ClickMarker {
		x: number;
		y: number;
		event: string;
		timestamp: number;
	}

	export type HoverItem =
		| { kind: 'fixation' | 'i2mc'; index: number; fixation: FixationDataEntry }
		| { kind: 'click'; index: number; click: ClickMarker };

	interface Props {
		width: number;
		height: number;
		gazePath: GazePoint[];
		fixations: FixationDataEntry[];
		i2mcFixations: FixationDataEntry[];
		clicks: ClickMarker[];
		aois: AoiRect[];
		showPath: boolean;
		showFixations: boolean;
		showI2mc: boolean;
		showClicks: boolean;
		showAois: boolean;
		onHover?: (item: HoverItem | null, event: PointerEvent) => void;
	}

	let {
		width,
		height,
		gazePath,
		fixations,
		i2mcFixations,
		clicks,
		aois,
		showPath,
		showFixations,
		showI2mc,
		showClicks,
		showAois,
		onHover
	}: Props = $props();

	const MAX_PATH_POINTS = 3000;

	const pathPoints = $derived.by(() => {
		const stride = Math.max(1, Math.ceil(gazePath.length / MAX_PATH_POINTS));
		const parts: string[] = [];
		for (let i = 0; i < gazePath.length; i += stride) {
			parts.push(`${gazePath[i].x.toFixed(1)},${gazePath[i].y.toFixed(1)}`);
		}
		return parts.join(' ');
	});

	// Recorded geometry repeats ids across validity intervals; label each id once.
	const displayAois = $derived.by(() => {
		const labeled: Record<string, true> = {};
		return aois.map((aoi) => {
			const showLabel = !labeled[aoi.id];
			labeled[aoi.id] = true;
			return { aoi, showLabel };
		});
	});

	function fixationRadius(duration: number): number {
		return Math.min(Math.max(duration / 25, 8), 40);
	}
</script>

{#snippet fixationMarkers(
	rows: FixationDataEntry[],
	kind: 'fixation' | 'i2mc',
	fill: string,
	stroke: string,
	textClass: string
)}
	{#each rows as fixation, i (`${fixation.fixation_index}-${fixation.timestamp}`)}
		{#if fixation.eyetracker_x !== null && fixation.eyetracker_y !== null}
			<g
				class="marker pointer-events-auto"
				onpointerenter={(e) => onHover?.({ kind, index: i, fixation }, e)}
				onpointermove={(e) => onHover?.({ kind, index: i, fixation }, e)}
				onpointerleave={(e) => onHover?.(null, e)}
			>
				<circle
					cx={fixation.eyetracker_x}
					cy={fixation.eyetracker_y}
					r={fixationRadius(fixation.duration)}
					{fill}
					{stroke}
					stroke-width="2"
				/>
				<text
					x={fixation.eyetracker_x}
					y={fixation.eyetracker_y + 5}
					text-anchor="middle"
					class="{textClass} text-[13px] font-bold"
				>
					{i + 1}
				</text>
			</g>
		{/if}
	{/each}
{/snippet}

<svg
	{width}
	{height}
	viewBox="0 0 {width} {height}"
	class="pointer-events-none absolute inset-0 h-full w-full"
>
	{#if showAois}
		{#each displayAois as { aoi, showLabel }, i (`${aoi.id}@${aoi.fromTs ?? 'static'}@${i}`)}
			<g>
				<rect
					x={aoi.left - aoi.bufferSize}
					y={aoi.top - aoi.bufferSize}
					width={aoi.right - aoi.left + 2 * aoi.bufferSize}
					height={aoi.bottom - aoi.top + 2 * aoi.bufferSize}
					fill="rgb(59 130 246 / 0.06)"
					stroke="rgb(59 130 246 / 0.5)"
					stroke-width="1.5"
					stroke-dasharray="6 4"
				/>
				<rect
					x={aoi.left}
					y={aoi.top}
					width={aoi.right - aoi.left}
					height={aoi.bottom - aoi.top}
					fill="none"
					stroke="rgb(59 130 246 / 0.8)"
					stroke-width="2"
				/>
				{#if showLabel}
					<text x={aoi.left + 4} y={aoi.top - 6} class="fill-blue-600 text-[14px] font-semibold">
						{aoi.id}
					</text>
				{/if}
			</g>
		{/each}
	{/if}

	{#if showPath}
		<polyline points={pathPoints} fill="none" stroke="rgb(31 41 55 / 0.55)" stroke-width="1.5" />
	{/if}

	{#if showFixations}
		{@render fixationMarkers(
			fixations,
			'fixation',
			'rgb(124 58 237 / 0.25)',
			'rgb(124 58 237 / 0.9)',
			'fill-violet-800'
		)}
	{/if}

	{#if showI2mc}
		{@render fixationMarkers(
			i2mcFixations,
			'i2mc',
			'rgb(217 119 6 / 0.25)',
			'rgb(217 119 6 / 0.9)',
			'fill-amber-700'
		)}
	{/if}

	{#if showClicks}
		{#each clicks as click, i (`${click.timestamp}-${i}`)}
			<g
				class="marker pointer-events-auto"
				onpointerenter={(e) => onHover?.({ kind: 'click', index: i, click }, e)}
				onpointermove={(e) => onHover?.({ kind: 'click', index: i, click }, e)}
				onpointerleave={(e) => onHover?.(null, e)}
			>
				<circle
					cx={click.x}
					cy={click.y}
					r="9"
					fill="rgb(37 99 235 / 0.9)"
					stroke="white"
					stroke-width="2.5"
				/>
			</g>
		{/each}
	{/if}
</svg>

<style>
	.marker:hover circle {
		stroke-width: 3.5;
	}
</style>
