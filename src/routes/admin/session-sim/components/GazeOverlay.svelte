<script lang="ts">
	import type { FixationDataEntry } from '$lib/database/db.types';
	import type { AoiRect } from '$lib/utils/sessionSim/types';
	import type { SlideTimeWindow } from '$lib/utils/scoreMetrics';

	export interface GazePoint {
		x: number;
		y: number;
	}

	/** counted = inside the slide's effective window, i.e. part of the score. */
	export type OverlayFixation = FixationDataEntry & { counted: boolean };

	interface Props {
		width: number;
		height: number;
		gazeBefore: GazePoint[];
		gazeAfter: GazePoint[];
		fixationsBefore: OverlayFixation[];
		fixationsAfter: OverlayFixation[];
		fixationsI2mc: OverlayFixation[];
		aois: AoiRect[];
		/** Effective slide window; AOI intervals outside it render dimmed. */
		timeWindow?: SlideTimeWindow | null;
		showGaze: boolean;
		showBefore: boolean;
		showAfter: boolean;
		showI2mc: boolean;
		showAois: boolean;
	}

	let {
		width,
		height,
		gazeBefore,
		gazeAfter,
		fixationsBefore,
		fixationsAfter,
		fixationsI2mc,
		aois,
		timeWindow = null,
		showGaze,
		showBefore,
		showAfter,
		showI2mc,
		showAois
	}: Props = $props();

	// Recorded geometry repeats ids across validity intervals; label each id
	// once and dim intervals that never overlap the slide's window.
	interface DisplayAoi {
		aoi: AoiRect;
		showLabel: boolean;
		active: boolean;
	}

	const displayAois = $derived.by((): DisplayAoi[] => {
		const labeled: Record<string, true> = {};
		return aois.map((aoi) => {
			const showLabel = !labeled[aoi.id];
			labeled[aoi.id] = true;
			const active =
				!timeWindow ||
				((aoi.fromTs === undefined || aoi.fromTs <= timeWindow.endTime) &&
					(aoi.toTs === undefined || aoi.toTs >= timeWindow.startTime));
			return { aoi, showLabel, active };
		});
	});

	const MAX_PATH_POINTS = 3000;

	function toPolyline(points: GazePoint[]): string {
		const stride = Math.max(1, Math.ceil(points.length / MAX_PATH_POINTS));
		const parts: string[] = [];
		for (let i = 0; i < points.length; i += stride) {
			parts.push(`${points[i].x.toFixed(1)},${points[i].y.toFixed(1)}`);
		}
		return parts.join(' ');
	}

	const beforePath = $derived(toPolyline(gazeBefore));
	const afterPath = $derived(toPolyline(gazeAfter));

	function fixationRadius(duration: number): number {
		return Math.min(Math.max(duration / 25, 8), 40);
	}
</script>

<svg {width} {height} viewBox="0 0 {width} {height}" class="h-full w-full">
	{#if showAois}
		{#each displayAois as { aoi, showLabel, active }, i (`${aoi.id}@${aoi.fromTs ?? 'static'}@${i}`)}
			{@const hue = aoi.synthetic ? 'rgb(107 114 128' : 'rgb(59 130 246'}
			<g opacity={active ? 1 : 0.25}>
				<rect
					x={aoi.left - aoi.bufferSize}
					y={aoi.top - aoi.bufferSize}
					width={aoi.right - aoi.left + 2 * aoi.bufferSize}
					height={aoi.bottom - aoi.top + 2 * aoi.bufferSize}
					fill="{hue} / 0.06)"
					stroke="{hue} / 0.5)"
					stroke-width="1.5"
					stroke-dasharray="6 4"
				/>
				<rect
					x={aoi.left}
					y={aoi.top}
					width={aoi.right - aoi.left}
					height={aoi.bottom - aoi.top}
					fill="none"
					stroke="{hue} / 0.8)"
					stroke-width="2"
					stroke-dasharray={aoi.synthetic ? '4 3' : undefined}
				/>
				{#if showLabel}
					<text
						x={aoi.left + 4}
						y={aoi.top - 6}
						class="{aoi.synthetic ? 'fill-gray-500' : 'fill-blue-600'} text-[14px] font-semibold"
					>
						{aoi.id}{aoi.synthetic ? ' (syntetické)' : ''}
					</text>
				{/if}
			</g>
		{/each}
	{/if}

	{#if showGaze && showBefore}
		<polyline points={beforePath} fill="none" stroke="rgb(156 163 175 / 0.6)" stroke-width="1.5" />
	{/if}
	{#if showGaze && showAfter}
		<polyline points={afterPath} fill="none" stroke="rgb(16 185 129 / 0.7)" stroke-width="1.5" />
	{/if}

	{#if showBefore}
		{#each fixationsBefore as fixation, i (`${fixation.fixation_index}-${fixation.timestamp}`)}
			{#if fixation.eyetracker_x !== null && fixation.eyetracker_y !== null}
				<circle
					cx={fixation.eyetracker_x}
					cy={fixation.eyetracker_y}
					r={fixationRadius(fixation.duration)}
					fill="rgb(107 114 128 / {fixation.counted ? 0.25 : 0.1})"
					stroke="rgb(107 114 128 / 0.8)"
					stroke-width="2"
					stroke-dasharray={fixation.counted ? undefined : '5 4'}
				/>
				<text
					x={fixation.eyetracker_x}
					y={fixation.eyetracker_y + 5}
					text-anchor="middle"
					class="fill-gray-600 text-[13px] font-bold"
				>
					{i + 1}
				</text>
			{/if}
		{/each}
	{/if}

	{#if showI2mc}
		{#each fixationsI2mc as fixation, i (`${fixation.fixation_index}-${fixation.timestamp}`)}
			{#if fixation.eyetracker_x !== null && fixation.eyetracker_y !== null}
				<circle
					cx={fixation.eyetracker_x}
					cy={fixation.eyetracker_y}
					r={fixationRadius(fixation.duration)}
					fill="rgb(217 119 6 / {fixation.counted ? 0.25 : 0.1})"
					stroke="rgb(217 119 6 / 0.9)"
					stroke-width="2"
					stroke-dasharray={fixation.counted ? undefined : '5 4'}
				/>
				<text
					x={fixation.eyetracker_x}
					y={fixation.eyetracker_y + 5}
					text-anchor="middle"
					class="fill-amber-700 text-[13px] font-bold"
				>
					{i + 1}
				</text>
			{/if}
		{/each}
	{/if}

	{#if showAfter}
		{#each fixationsAfter as fixation, i (`${fixation.fixation_index}-${fixation.timestamp}`)}
			{#if fixation.eyetracker_x !== null && fixation.eyetracker_y !== null}
				<circle
					cx={fixation.eyetracker_x}
					cy={fixation.eyetracker_y}
					r={fixationRadius(fixation.duration)}
					fill="rgb(79 70 229 / {fixation.counted ? 0.25 : 0.1})"
					stroke="rgb(79 70 229 / 0.9)"
					stroke-width="2"
					stroke-dasharray={fixation.counted ? undefined : '5 4'}
				/>
				<text
					x={fixation.eyetracker_x}
					y={fixation.eyetracker_y + 5}
					text-anchor="middle"
					class="fill-indigo-700 text-[13px] font-bold"
				>
					{i + 1}
				</text>
			{/if}
		{/each}
	{/if}
</svg>
