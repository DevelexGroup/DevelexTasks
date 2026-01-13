<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { db } from '$lib/database/db';
	import type { GazeSampleDataEntry, FixationDataEntry } from '$lib/database/db.types';
	import { SvelteMap } from 'svelte/reactivity';
	import { untrack } from 'svelte';
	import JSZip from 'jszip';

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
	let isExportingAll = $state(false);
	let timestampOrder = $state<'asc' | 'desc'>('desc');

	// Reset filters when table changes
	$effect(() => {
		// Only track selectedTable
		const table = selectedTable;
		if (table) {
			// Use untrack for side effects to prevent infinite loops
			untrack(() => {
				selectedChildId = '';
				selectedSessionId = '';
				tableData = [];
				loadedCount = 0;
				hasMore = true;
				loadChildIds();
			});
		}
	});

	// Load session IDs when child is selected
	$effect(() => {
		// Only track selectedChildId and selectedTable
		const childId = selectedChildId;
		const table = selectedTable;
		if (childId && table) {
			untrack(() => {
				selectedSessionId = '';
				tableData = [];
				loadedCount = 0;
				hasMore = true;
				loadSessionIds();
			});
		}
	});

	// Load data when session is selected
	$effect(() => {
		// Only track the filter selections, not the data
		const sessionId = selectedSessionId;
		const table = selectedTable;
		const childId = selectedChildId;

		if (sessionId && table && childId) {
			untrack(() => {
				tableData = [];
				loadedCount = 0;
				hasMore = true;
				loadTableData();
			});
		}
	});

	async function loadChildIds() {
		if (!selectedTable) return;

		const table = db[selectedTable];
		childIds = await table.orderBy('child_id').uniqueKeys() as string[];
	}

	async function loadSessionIds() {
		if (!selectedTable || !selectedChildId) return;

		const table = db[selectedTable];
		const filtered = await table
			.where('child_id')
			.equals(selectedChildId)
			.toArray();

		const sessionMap = new Map<string, string>();
		for (const entry of filtered) {
			if (!sessionMap.has(entry.session_id)) {
				sessionMap.set(entry.session_id, entry.task_name);
			}
		}

		sessionIds = Array.from(sessionMap.entries())
			.map(([sessionId, taskName]) => ({ sessionId, taskName }))
			.sort((a, b) => -a.sessionId.localeCompare(b.sessionId));
	}


	async function loadTableData() {
		if (!selectedTable || !selectedChildId || !selectedSessionId || isLoading) return;

		isLoading = true;
		try {
			const table = db[selectedTable];

			let collection = table
				.where('[child_id+session_id]')
				.equals([selectedChildId, selectedSessionId]);

			if (timestampOrder === 'desc') {
				collection = collection.reverse();
			}

			const newData = await collection
				.offset(loadedCount)
				.limit(LOAD_SIZE)
				.sortBy('timestamp');

			tableData = [...tableData, ...newData];
			loadedCount += newData.length;
			hasMore = newData.length === LOAD_SIZE;
		} finally {
			isLoading = false;
		}
	}


	async function loadMoreData() {
		if (!hasMore || isLoading) return;
		await loadTableData();
	}

	function toggleTimestampOrder() {
		timestampOrder = timestampOrder === 'asc' ? 'desc' : 'asc';
		tableData = [];
		loadedCount = 0;
		hasMore = true;
		loadTableData();
	}

	function handleScroll(event: Event) {
		const target = event.target as HTMLElement;
		const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

		if (scrollBottom < 200 && hasMore && !isLoading) {
			loadMoreData();
		}
	}

	async function getTotalCount(): Promise<number> {
		if (!selectedTable || !selectedChildId || !selectedSessionId) return 0;

		const table = db[selectedTable];
		const count = await table
			.where('child_id').equals(selectedChildId)
			.and(entry => entry.session_id === selectedSessionId)
			.count();
		return count;
	}

	function getTableHeaders(): (string | null)[] {
		if (selectedTable === 'gazeSamples') {
			return [null, null, null, null, 'Stimulus ID', 'Timestamp', 'Eye X', 'Eye Y', 'AOI', 'Mouse X', 'Mouse Y', 'Event', 'Sound', 'Mistake Type', 'Result'];
		} else if (selectedTable === 'fixationData') {
			return [null, null, null, null, 'Stimulus ID', 'Timestamp', 'Eye X', 'Eye Y', 'Duration', 'AOI', 'Fixation Index'];
		}
		return [];
	}

	function getTableExportHeaders(): string[] {
		if (selectedTable) {
			return getExportHeadersForTable(selectedTable);
		}
		return [];
	}

	function getExportHeadersForTable(table: 'gazeSamples' | 'fixationData'): string[] {
		if (table === 'gazeSamples') {
			return ['ID', 'Child ID', 'Session ID', 'Task', 'Stimulus ID', 'Timestamp', 'Eye X', 'Eye Y', 'AOI', 'Mouse X', 'Mouse Y', 'Event', 'Sound', 'Mistake Type', 'Result'];
		} else {
			return ['ID', 'Child ID', 'Session ID', 'Task', 'Stimulus ID', 'Timestamp', 'Eye X', 'Eye Y', 'Duration', 'AOI', 'Fixation Index'];
		}
	}

	function formatTimestamp(unixTimestamp: number, format: 'full' | 'simple' | 'filename' = 'full'): string {
		const date = new Date(Math.floor(unixTimestamp));
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const seconds = String(date.getSeconds()).padStart(2, '0');

		if (format === 'filename') {
			return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
		}

		if (format === 'simple') {
			return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
		}

		// format === 'full'
		const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
		const microseconds = String(Math.floor((unixTimestamp % 1) * 1000)).padStart(3, '0');
		return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}.${milliseconds}${microseconds}`;
	}


	function formatColumnValue(column: string, value: unknown): string {
		if (value === null || value === undefined) return '-';
		if (column == 'Timestamp' || column == 'Session ID') {
			const timestampNum = typeof value === 'number' ? value : parseFloat(String(value));
			return formatTimestamp(timestampNum, column == 'Timestamp' ? 'full' : 'simple');
		}
		if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '-';
		if (typeof value === 'number') return value.toFixed(2);
		return String(value);
	}

	function formatExportedColumnValue(column: string, value: unknown): string {
		if (value === null || value === undefined) return '';
		if (column == 'Timestamp' || column == 'Session ID') {
			const timestampNum = typeof value === 'number' ? value : parseFloat(String(value));
			return formatTimestamp(timestampNum, column == 'Timestamp' ? 'full' : 'simple');
		}
		if (Array.isArray(value)) return value.length > 0 ? value.join('|') : '';
		return String(value);
	}

	function getCellValue(entry: GazeSampleDataEntry | FixationDataEntry, index: number): unknown {
		if (selectedTable) {
			return getCellValueForTable(entry, index, selectedTable);
		}
		return null;
	}

	function getCellValueForTable(entry: GazeSampleDataEntry | FixationDataEntry, index: number, table: 'gazeSamples' | 'fixationData'): unknown {
		if (table === 'gazeSamples') {
			const data = entry as GazeSampleDataEntry;
			const values = [
				data.id, data.child_id, data.session_id, data.task_name, data.stimulus_id, data.timestamp,
				data.eyetracker_x, data.eyetracker_y, data.aoi, data.mouse_x, data.mouse_y,
				data.events, data.sound_name, data.mistake_type, data.task_result
			];
			return values[index];
		} else {
			const data = entry as FixationDataEntry;
			const values = [
				data.id, data.child_id, data.session_id, data.task_name, data.stimulus_id, data.timestamp,
				data.eyetracker_x, data.eyetracker_y, data.duration, data.aoi, data.fixation_index
			];
			return values[index];
		}
	}

	async function exportData() {
		if (!selectedTable || !selectedChildId || !selectedSessionId) return;

		const table = db[selectedTable];
		const allData = await table
			.where('child_id').equals(selectedChildId)
			.and(entry => entry.session_id === selectedSessionId)
			.sortBy('timestamp');

		// Get task name from the first entry
		const taskName = allData.length > 0 ? allData[0].task_name : 'unknown';

		// Format session ID as timestamp for filename
		const formattedSessionId = formatTimestamp(parseFloat(selectedSessionId), 'filename');

		// Convert to CSV
		const headers = getTableExportHeaders();
		const csvRows = [headers.join(',')];

		allData.forEach(entry => {
			const row = headers.map((column, index) => {
				const value = getCellValue(entry, index);
				const formatted = formatExportedColumnValue(column, value);
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
		link.setAttribute('download', `${selectedTable}_${selectedChildId}_${taskName}_${formattedSessionId}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	async function exportAll() {
		isExportingAll = true;
		try {
			const zip = new JSZip();
			const tables: ('gazeSamples' | 'fixationData')[] = ['gazeSamples', 'fixationData'];

			for (const tableName of tables) {
				const folder = zip.folder(tableName);
				if (!folder) continue;

				const table = db[tableName];
				const allData = await table.toArray();

				// Group data by child_id and session_id
				const grouped = new SvelteMap<string, (GazeSampleDataEntry | FixationDataEntry)[]>();
				allData.forEach(entry => {
					const key = `${entry.child_id}_${entry.session_id}`;
					if (!grouped.has(key)) {
						grouped.set(key, []);
					}
					grouped.get(key)!.push(entry);
				});

				// Create CSV for each session
				const headers = getExportHeadersForTable(tableName);

				for (const [key, entries] of grouped) {
					const sortedEntries = entries.sort((a, b) => a.timestamp - b.timestamp);
					const firstEntry = sortedEntries[0];
					const taskName = firstEntry.task_name;
					const formattedSessionId = formatTimestamp(parseFloat(String(firstEntry.session_id)), 'filename');

					const csvRows = [headers.join(',')];
					sortedEntries.forEach(entry => {
						const row = headers.map((column, index) => {
							const value = getCellValueForTable(entry, index, tableName);
							const formatted = formatExportedColumnValue(column, value);
							return formatted.includes(',') ? `"${formatted.replace(/"/g, '""')}"` : formatted;
						});
						csvRows.push(row.join(','));
					});

					const csvContent = csvRows.join('\n');
					const fileName = `${firstEntry.child_id}_${taskName}_${formattedSessionId}.csv`;
					folder.file(fileName, csvContent);
				}
			}

			const content = await zip.generateAsync({ type: 'blob' });
			const link = document.createElement('a');
			const url = URL.createObjectURL(content);
			link.setAttribute('href', url);
			link.setAttribute('download', `database_export_${formatTimestamp(Date.now(), 'filename')}.zip`);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} finally {
			isExportingAll = false;
		}
	}
</script>

<svelte:head>
	<title>Admin - Develex Tasks</title>
	<meta name="description" content="Admin page for Develex Tasks" />
</svelte:head>

<section class="absolute flex h-16 top-4 left-4 items-center gap-4">
	<div class="flex flex-col">
		<label for="table" class="text-sm font-medium text-gray-700 mb-1">Table:</label>
		<select
			id="table"
			bind:value={selectedTable}
			class="px-3 py-1.5 bg-white border border-gray-300 text-gray-800 rounded-md min-w-[150px]"
		>
			<option value="">Select table&hellip;</option>
			<option value="gazeSamples">gazeSamples</option>
			<option value="fixationData">fixationData</option>
		</select>
	</div>

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
				<option value={session.sessionId}>[{session.taskName}] {formatTimestamp(parseFloat(String(session.sessionId)), 'simple')}</option>
			{/each}
		</select>
	</div>
</section>

<section class="absolute top-4 right-4 flex gap-4 items-center">
	<button
		class="px-3 py-1.5 bg-blue-500 text-gray-50 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
		disabled={!selectedTable || !selectedChildId || !selectedSessionId}
		onclick={exportData}
	>
		Exportovat&hellip;
	</button>

	<button
		class="px-3 py-1.5 bg-green-500 text-gray-50 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
		disabled={isExportingAll}
		onclick={exportAll}
	>
		{isExportingAll ? 'Exportuji…' : 'Exportovat vše…'}
	</button>
</section>

<section
	class="table-container w-full flex flex-col overflow-auto mt-24 mb-16 bg-gray-100 px-4"
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
		<div
			class="overflow-x-auto bg-white rounded-lg shadow"
			bind:this={scrollContainer}
			onscroll={handleScroll}
		>
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50 sticky top-0">
					<tr>
						{#each getTableHeaders() as header, colIndex (colIndex)}
							{#if header !== null}
								{#if header === 'Timestamp'}
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
										<button
											class="flex items-center uppercase gap-2 hover:text-gray-700 cursor-pointer transition-colors"
											onclick={toggleTimestampOrder}
										>
											{header}
											<svg
												class="w-4 h-4 transition-transform"
												style="transform: rotate({timestampOrder === 'asc' ? '0deg' : '180deg'})"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
											</svg>
										</button>
									</th>
								{:else}
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
										{header}
									</th>
								{/if}
							{/if}
						{/each}
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each tableData as entry, rowIndex (entry.id)}
						<tr class={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
							{#each getTableHeaders() as header, colIndex (colIndex)}
								{#if header !== null}
									<td class="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
										{formatColumnValue(header, getCellValue(entry, colIndex))}
									</td>
								{/if}
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>

			{#if isLoading}
				<div class="flex items-center justify-center py-4">
					<p class="text-gray-500">Načítání&hellip;</p>
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

<div class="fixed flex gap-1 bottom-4 left-4">
	<button
		class="px-3 py-1.5 bg-gray-300 text-gray-800 rounded-md"
		onclick={() => goto(resolve(`/`))}
	>
		Zpět
	</button>
</div>

<div class="fixed flex gap-1 bottom-4 right-4">
	{#if selectedTable && selectedChildId && selectedSessionId}
		<span class="text-gray-700">Zobrazeno záznamů: {tableData.length} (z celkem {#await getTotalCount() then totalCount}{totalCount}{/await})</span>
	{/if}
</div>

<style>
	.table-container{
		height: calc(100vh - 10rem);
	}
</style>

