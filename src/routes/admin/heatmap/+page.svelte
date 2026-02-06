<script lang="ts">
	import TaskSelectionWindow, {
		type TaskSelectionResult
	} from './components/TaskSelectionWindow.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Heatmap from './components/Heatmap.svelte';

	let selectedTask: TaskSelectionResult | null = $state(null);
	let selectedSlideIndex: number = $state(0);

	let showingMouse: boolean = $state(false);

	let events: { id: number; x: number; y: number; event: string; type: string }[] = $state([]);

	let maxSlides = $derived(() => {
		if (!selectedTask) return 0;
		return selectedTask.maxSlides;
	});

	let points = $derived(() => {
		if (!selectedTask) return [];
		return selectedTask.gazeSamples
			.filter((sample) => sample.slide_index - 1 === selectedSlideIndex)
			.map((sample) => ({
				x: showingMouse ? sample.mouse_x : sample.eyetracker_x,
				y: showingMouse ? sample.mouse_y : sample.eyetracker_y,
				value: 1
			}));
	});

	$effect(() => {
		if (selectedTask) {
			selectedSlideIndex = 0;
		}
	});

	function loadEvents() {
		if (!selectedTask) return;
		let selectedCurrentIndex = 0;
		let selectEvents = selectedTask.gazeSamples
			.filter(
				(sample) =>
					sample.slide_index - 1 === selectedSlideIndex &&
					sample.events.some((ev) => ev.startsWith('select_'))
			)
			.map((sample) => ({
				id: selectedCurrentIndex++,
				x: sample.mouse_x ?? 0,
				y: sample.mouse_y ?? 0,
				event: sample.events.find((ev) => ev.startsWith('select_')) || '',
				type: 'mouse'
			}));

		let fixationCurrentIndex = 0;
		let fixationEvents = selectedTask.fixationData
			.filter((fix) => fix.slide_index - 1 === selectedSlideIndex)
			.map((fix) => ({
				id: fixationCurrentIndex++,
				x: fix.eyetracker_x ?? 0,
				y: fix.eyetracker_y ?? 0,
				event: `fixation(${fix.duration}ms)`,
				type: 'eyetracker'
			}));

		events = [...selectEvents, ...fixationEvents];
	}

	$effect(() => {
		loadEvents();
	});

	function handleConfirm(result: TaskSelectionResult) {
		selectedTask = result;
	}

	function handleNextSlide() {
		if (selectedSlideIndex < maxSlides() - 1) {
			selectedSlideIndex += 1;
		}
	}

	function handlePrevSlide() {
		if (selectedSlideIndex > 0) {
			selectedSlideIndex -= 1;
		}
	}
</script>

<svelte:head>
	<title>Heatmap</title>
	<meta name="description" content="Heatmap admin page for Develex Tasks" />
</svelte:head>

{#if selectedTask}
	<div class="flex h-screen w-screen items-center justify-center bg-task-background">
		<Heatmap data={points()} />
	</div>

	<div class="absolute bottom-4 left-4">
		<button
			class="rounded-md bg-gray-300 px-3 py-1.5 text-gray-800"
			onclick={() => goto(resolve(`/admin`))}
		>
			Zpět
		</button>
	</div>

	<!-- center -->
	<div
		class="absolute bottom-4 left-1/2 flex -translate-x-1/2 transform flex-col items-center gap-2"
	>
		<div class="text-center text-gray-800">
			{showingMouse ? 'Pozice myši' : 'Eyetracker'}
		</div>
		<div class="flex gap-2">
			<button
				class="rounded-md bg-gray-300 px-3 py-1.5 text-gray-800"
				onclick={() => (showingMouse = !showingMouse)}
			>
				{#if showingMouse}
					Přepnout na eyetracker
				{:else}
					Přepnout na pozici myši
				{/if}
			</button>
		</div>
	</div>

	<div class="absolute right-4 bottom-4 flex flex-col">
		<div class="mb-2 text-gray-800">
			Slide {selectedSlideIndex + 1} / {maxSlides()}
		</div>
		<div class="flex">
			<button
				class="rounded-md bg-gray-300 px-3 py-1.5 text-gray-800"
				onclick={handlePrevSlide}
				disabled={selectedSlideIndex === 0}
			>
				Předchozí slide
			</button>
			<button
				class="ml-2 rounded-md bg-gray-300 px-3 py-1.5 text-gray-800"
				onclick={handleNextSlide}
				disabled={selectedSlideIndex === maxSlides() - 1}
			>
				Další slide
			</button>
		</div>
	</div>
{/if}

<TaskSelectionWindow open={!selectedTask} onConfirm={handleConfirm} />

<div class="events pointer-events-none absolute top-0 left-0 h-screen w-screen overflow-hidden">
	{#each events as event (event)}
		{#if (event.type === 'mouse' && showingMouse) || (event.type === 'eyetracker' && !showingMouse)}
			<div
				class="event-marker pointer-events-auto absolute"
				style="transform: translate({event.x}px, {event.y}px);"
				data-title={`[${event.id + 1}] ${event.event}`}
			>
				<div
					class="dot"
					class:bg-blue-500={event.type === 'mouse'}
					class:bg-purple-500={event.type === 'eyetracker'}
				></div>
			</div>
		{/if}
	{/each}
</div>

<style>
	.event-marker {
		position: absolute;
		display: flex;
		align-items: center;
		gap: 4px;
		z-index: 1;
	}

	.event-marker .dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		box-shadow:
			0 0 0 2px white,
			0 0 0 3px rgba(0, 0, 0, 0.5);
		flex-shrink: 0;
		margin-left: -6px;
		margin-top: -6px;
		cursor: pointer;
		transition: transform 0.15s ease;
	}

	.event-marker:hover {
		z-index: 1000;
	}

	.event-marker:hover .dot {
		transform: scale(1.3);
	}

	.event-marker .label {
		font-size: 10px;
		white-space: nowrap;
		background: rgba(0, 0, 0, 0.85);
		color: white;
		padding: 2px 6px;
		border-radius: 4px;
		margin-left: 6px;
		z-index: 10;
		pointer-events: none;
	}

	/* Show label on hover when labels are hidden globally */
	.event-marker:hover::after {
		content: attr(data-title);
		position: absolute;
		left: 12px;
		top: -6px;
		font-size: 12px;
		white-space: nowrap;
		background: rgba(0, 0, 0, 0.85);
		color: white;
		padding: 2px 6px;
		border-radius: 4px;
		z-index: 100;
	}

	/* Hide the hover tooltip when labels are already showing */
	.event-marker:has(.label):hover::after {
		display: none;
	}
</style>
