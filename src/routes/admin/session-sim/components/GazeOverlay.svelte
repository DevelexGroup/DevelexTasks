<script lang="ts">
	import type { FixationDataEntry } from '$lib/database/db.types';
	import type { AoiRect } from '$lib/utils/sessionSim/types';

	export interface GazePoint {
		x: number;
		y: number;
	}

	interface Props {
		width: number;
		height: number;
		gazeBefore: GazePoint[];
		gazeAfter: GazePoint[];
		fixationsBefore: FixationDataEntry[];
		fixationsAfter: FixationDataEntry[];
		aois: AoiRect[];
		showGaze: boolean;
		showBefore: boolean;
		showAfter: boolean;
		showAois: boolean;
		onDragOffset?: (dx: number, dy: number) => void;
	}

	let {
		width,
		height,
		gazeBefore,
		gazeAfter,
		fixationsBefore,
		fixationsAfter,
		aois,
		showGaze,
		showBefore,
		showAfter,
		showAois,
		onDragOffset
	}: Props = $props();

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

	// Drag anywhere on the overlay shifts the active correction offset.
	// The overlay renders inside the stage's scale transform, so screen deltas
	// are converted through the effective visual scale.
	let dragging = $state(false);
	let lastClient = { x: 0, y: 0 };

	function visualScale(element: HTMLElement): number {
		const rect = element.getBoundingClientRect();
		return rect.width > 0 ? rect.width / width : 1;
	}

	function handlePointerDown(event: PointerEvent) {
		if (!onDragOffset) return;
		dragging = true;
		lastClient = { x: event.clientX, y: event.clientY };
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!dragging || !onDragOffset) return;
		const scale = visualScale(event.currentTarget as HTMLElement);
		onDragOffset((event.clientX - lastClient.x) / scale, (event.clientY - lastClient.y) / scale);
		lastClient = { x: event.clientX, y: event.clientY };
	}

	function handlePointerUp() {
		dragging = false;
	}
</script>

<div
	class="h-full w-full {onDragOffset ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : ''}"
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
>
	<svg {width} {height} viewBox="0 0 {width} {height}" class="h-full w-full">
		{#if showAois}
			{#each aois as aoi (aoi.id)}
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
				<text x={aoi.left + 4} y={aoi.top - 6} class="fill-blue-600 text-[14px] font-semibold">
					{aoi.id}
				</text>
			{/each}
		{/if}

		{#if showGaze && showBefore}
			<polyline
				points={beforePath}
				fill="none"
				stroke="rgb(156 163 175 / 0.6)"
				stroke-width="1.5"
			/>
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
						fill="rgb(107 114 128 / 0.25)"
						stroke="rgb(107 114 128 / 0.8)"
						stroke-width="2"
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

		{#if showAfter}
			{#each fixationsAfter as fixation, i (`${fixation.fixation_index}-${fixation.timestamp}`)}
				{#if fixation.eyetracker_x !== null && fixation.eyetracker_y !== null}
					<circle
						cx={fixation.eyetracker_x}
						cy={fixation.eyetracker_y}
						r={fixationRadius(fixation.duration)}
						fill="rgb(79 70 229 / 0.25)"
						stroke="rgb(79 70 229 / 0.9)"
						stroke-width="2"
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
</div>
