<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { db } from '$lib/database/db';
	import type { GazeSampleDataEntry, FixationDataEntry } from '$lib/database/db.types';
	import { SvelteMap } from 'svelte/reactivity';

	let selectedTable = $state<'gazeSamples' | 'fixationData' | ''>('');
	let childIds = $state<string[]>([]);
	let sessionIds = $state<{ sessionId: string; taskName: string }[]>([]);
	let selectedChildId = $state<string>('');
	let selectedSessionId = $state<string>('');

	let tableData = $state<(GazeSampleDataEntry | FixationDataEntry)[]>([]);
	let loadedCount = $state(0);
	const LOAD_SIZE = 250;
	let isLoading = $state(false);
	let hasMore = $state(true);
	let scrollContainer: HTMLElement;

	// Reset filters when table changes
	$effect(() => {
		if (selectedTable) {
			selectedChildId = '';
			selectedSessionId = '';
			tableData = [];
			loadedCount = 0;
			hasMore = true;
			loadChildIds();
		}
	});

	// Load session IDs when child is selected
	$effect(() => {
		if (selectedChildId && selectedTable) {
			selectedSessionId = '';
			tableData = [];
			loadedCount = 0;
			hasMore = true;
			loadSessionIds();
		}
	});

	// Load data when session is selected
	$effect(() => {
		if (selectedSessionId && selectedTable && selectedChildId) {
			tableData = [];
			loadedCount = 0;
			hasMore = true;
			loadTableData();
		}
	});

	async function loadChildIds() {
		if (!selectedTable) return;

		const table = db[selectedTable];
		const allData = await table.toArray();
		childIds = [...new Set(allData.map(entry => entry.child_id))].sort();
	}

	async function loadSessionIds() {
		if (!selectedTable || !selectedChildId) return;

		const table = db[selectedTable];
		const filtered = await table.where('child_id').equals(selectedChildId).toArray();
		const sessionMap = new SvelteMap<string, string>();

		filtered.forEach(entry => {
			if (!sessionMap.has(entry.session_id)) {
				sessionMap.set(entry.session_id, entry.task_name);
			}
		});

		sessionIds = Array.from(sessionMap.entries())
			.map(([sessionId, taskName]) => ({ sessionId, taskName }))
			.sort((a, b) => a.sessionId.localeCompare(b.sessionId));
	}

	async function loadTableData() {
		if (!selectedTable || !selectedChildId || !selectedSessionId || isLoading) return;

		isLoading = true;
		try {
			const table = db[selectedTable];
			const filtered = await table
				.where('child_id').equals(selectedChildId)
				.and(entry => entry.session_id === selectedSessionId)
				.reverse()
				.sortBy('timestamp');

			const newData = filtered.slice(loadedCount, loadedCount + LOAD_SIZE);
			tableData = [...tableData, ...newData];
			loadedCount += newData.length;
			hasMore = loadedCount < filtered.length;
		} finally {
			isLoading = false;
		}
	}

	async function loadMoreData() {
		if (!hasMore || isLoading) return;
		await loadTableData();
	}

	function handleScroll(event: Event) {
		const target = event.target as HTMLElement;
		const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

		if (scrollBottom < 200 && hasMore && !isLoading) {
			loadMoreData();
		}
	}

	function getTableHeaders(): string[] {
		if (selectedTable === 'gazeSamples') {
			return ['ID', 'Child ID', 'Session ID', 'Task', 'Timestamp', 'Eye X', 'Eye Y', 'AOI', 'Mouse X', 'Mouse Y', 'Key Event', 'Sound', 'Error Type', 'Result'];
		} else if (selectedTable === 'fixationData') {
			return ['ID', 'Child ID', 'Session ID', 'Task', 'Timestamp', 'Eye X', 'Eye Y', 'Duration', 'AOI', 'Fixation Index'];
		}
		return [];
	}

	function formatValue(value: unknown): string {
		if (value === null || value === undefined) return '-';
		if (value instanceof Date) return value.toLocaleString();
		if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '-';
		if (typeof value === 'number') return value.toFixed(2);
		return String(value);
	}

	function getCellValue(entry: GazeSampleDataEntry | FixationDataEntry, index: number): unknown {
		if (selectedTable === 'gazeSamples') {
			const data = entry as GazeSampleDataEntry;
			const values = [
				data.id, data.child_id, data.session_id, data.task_name, data.timestamp,
				data.eyetracker_x, data.eyetracker_y, data.aoi, data.mouse_x, data.mouse_y,
				data.key_event, data.sound_name, data.error_type, data.task_result
			];
			return values[index];
		} else if (selectedTable === 'fixationData') {
			const data = entry as FixationDataEntry;
			const values = [
				data.id, data.child_id, data.session_id, data.task_name, data.timestamp,
				data.eyetracker_x, data.eyetracker_y, data.duration, data.aoi, data.fixation_index
			];
			return values[index];
		}
		return null;
	}

	async function exportData() {
		if (!selectedTable || !selectedChildId || !selectedSessionId) return;

		const table = db[selectedTable];
		const allData = await table
			.where('child_id').equals(selectedChildId)
			.and(entry => entry.session_id === selectedSessionId)
			.reverse()
			.sortBy('timestamp');

		// Convert to CSV
		const headers = getTableHeaders();
		const csvRows = [headers.join(',')];

		allData.forEach(entry => {
			const row = headers.map((_, index) => {
				const value = getCellValue(entry, index);
				const formatted = formatValue(value);
				// Escape quotes and wrap in quotes if contains comma
				return formatted.includes(',') ? `"${formatted.replace(/"/g, '""')}"` : formatted;
			});
			csvRows.push(row.join(','));
		});

		const csvContent = csvRows.join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', `${selectedTable}_${selectedChildId}_${selectedSessionId}_${new Date().toISOString().split('T')[0]}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<svelte:head>
	<title>Admin - Develex Tasks</title>
	<meta name="description" content="Admin page for Develex Tasks" />
</svelte:head>

<section class="absolute flex h-16 top-4 left-4 items-center">
	<button
		class="px-3 py-1.5 bg-gray-300 text-gray-800 rounded-md"
		class:selected={selectedTable === 'gazeSamples'}
		onclick={() => selectedTable = 'gazeSamples'}
	>
		gazeSamples
	</button>
	<button
		class="ml-2 px-3 py-1.5 bg-gray-300 text-gray-800 rounded-md"
		class:selected={selectedTable === 'fixationData'}
		onclick={() => selectedTable = 'fixationData'}
	>
		fixationData
	</button>
</section>

<section class="absolute top-4 right-4 flex gap-4 items-center">
	<div class="flex flex-col">
		<label for="childId" class="text-sm font-medium text-gray-700 mb-1">Child ID:</label>
		<select
			id="childId"
			bind:value={selectedChildId}
			disabled={!selectedTable}
			class="px-3 py-1.5 bg-white border border-gray-300 text-gray-800 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed min-w-[150px]"
		>
			<option value="">Select child&hellip;</option>
			{#each childIds as childId (childId)}
				<option value={childId}>{childId}</option>
			{/each}
		</select>
	</div>

	<div class="flex flex-col">
		<label for="sessionId" class="text-sm font-medium text-gray-700 mb-1">Session ID:</label>
		<select
			id="sessionId"
			bind:value={selectedSessionId}
			disabled={!selectedChildId}
			class="px-3 py-1.5 bg-white border border-gray-300 text-gray-800 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed min-w-[200px]"
		>
			<option value="">Select session&hellip;</option>
			{#each sessionIds as session (session.sessionId)}
				<option value={session.sessionId}>[{session.taskName}] {session.sessionId}</option>
			{/each}
		</select>
	</div>

	<button
		class="px-3 py-1.5 bg-blue-500 text-gray-50 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
		disabled={!selectedTable || !selectedChildId || !selectedSessionId}
		onclick={exportData}
	>
		Exportovat&hellip;
	</button>
</section>

<section
	class="w-full h-full flex flex-col overflow-auto mt-24 mb-16 bg-gray-100 px-4"
	bind:this={scrollContainer}
	onscroll={handleScroll}
>
	{#if !selectedTable}
		<div class="flex items-center justify-center h-full">
			<p class="text-gray-500 text-lg">Vyberte tabulku pro zobrazení dat</p>
		</div>
	{:else if !selectedChildId}
		<div class="flex items-center justify-center h-full">
			<p class="text-gray-500 text-lg">Vyberte Child ID</p>
		</div>
	{:else if !selectedSessionId}
		<div class="flex items-center justify-center h-full">
			<p class="text-gray-500 text-lg">Vyberte Session ID</p>
		</div>
	{:else if tableData.length === 0 && !isLoading}
		<div class="flex items-center justify-center h-full">
			<p class="text-gray-500 text-lg">Žádná data k zobrazení</p>
		</div>
	{:else}
		<div class="overflow-x-auto bg-white rounded-lg shadow">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50 sticky top-0">
					<tr>
						{#each getTableHeaders() as header (header)}
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
								{header}
							</th>
						{/each}
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each tableData as entry, rowIndex (entry.id)}
						<tr class={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
							{#each getTableHeaders() as header, colIndex (header)}
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{formatValue(getCellValue(entry, colIndex))}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>

			{#if isLoading}
				<div class="flex items-center justify-center py-4">
					<p class="text-gray-500">Načítání...</p>
				</div>
			{/if}

			{#if !hasMore && tableData.length > 0}
				<div class="flex items-center justify-center py-4">
					<p class="text-gray-500 text-sm">Načteny všechny záznamy ({tableData.length})</p>
				</div>
			{/if}
		</div>
	{/if}
</section>

<div class="absolute bottom-4 left-4">
	<button
		class="px-3 py-1.5 bg-gray-300 text-gray-800 rounded-md"
		onclick={() => goto(resolve(`/`))}
	>
		Zpět
	</button>
</div>

<style>
	button.selected {
		background-color: #3b82f6;
		color: white;
	}
</style>

