<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { db } from '$lib/database/db';
	import type { GazeSampleDataEntry, FixationDataEntry, SessionScoreDataEntry } from '$lib/database/db.types';
	import { untrack } from 'svelte';
	import ExportWindow from './components/ExportWindow.svelte';

	let selectedTable = $state<'gazeSamples' | 'fixationData' | 'sessionScores' | ''>('');
	let childIds = $state<string[]>([]);
	let sessionIds = $state<{ sessionId: string; taskName: string }[]>([]);
	let selectedChildId = $state<string>('');
	let selectedSessionId = $state<string>('');

	let tableData = $state<(GazeSampleDataEntry | FixationDataEntry | SessionScoreDataEntry)[]>([]);
	let loadedCount = $state(0);
	const LOAD_SIZE = 250;
	let isLoading = $state(false);
	let hasMore = $state(true);
	let scrollContainer: HTMLElement;
	let exportWindowOpen = $state(false);
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
				if (table === 'sessionScores') {
					// sessionScores doesn't need session selection, load data directly
					loadTableData();
				} else {
					loadSessionIds();
				}
			});
		}
	});

	// Load data when session is selected (for non-sessionScores tables)
	$effect(() => {
		// Only track the filter selections, not the data
		const sessionId = selectedSessionId;
		const table = selectedTable;
		const childId = selectedChildId;

		if (sessionId && table && childId && table !== 'sessionScores') {
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

		// eslint-disable-next-line svelte/prefer-svelte-reactivity
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
		if (!selectedTable || !selectedChildId || isLoading) return;
		// For non-sessionScores tables, require sessionId
		if (selectedTable !== 'sessionScores' && !selectedSessionId) return;

		isLoading = true;
		try {
			const table = db[selectedTable];

			let collection;
			if (selectedTable === 'sessionScores') {
				// sessionScores only filters by child_id
				collection = table.where('child_id').equals(selectedChildId);
			} else {
				collection = table
					.where('[child_id+session_id]')
					.equals([selectedChildId, selectedSessionId]);
			}

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
			return [null, null, null, null, 'Slide Index', 'Stimulus ID', 'Timestamp', 'Eye X', 'Eye Y', 'AOI', 'Mouse X', 'Mouse Y', 'Event', 'Sound', 'Mistake Type', 'Result'];
		} else if (selectedTable === 'fixationData') {
			return [null, null, null, null, 'Slide Index', 'Stimulus ID', 'Timestamp', 'Eye X', 'Eye Y', 'Duration', 'AOI', 'Fixation Index'];
		} else if (selectedTable === 'sessionScores') {
			return [null, null, 'Session ID', 'Task', 'Slide Index', 'Stimulus ID', 'Timestamp', 'Error Rate', 'Response Time', 'Mean Fix Dur', 'Fix Count', 'AOI Target Fix', 'AOI Field Fix', 'Regression Count'];
		}
		return [];
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
		if (typeof value === 'number') {
			return Number.isInteger(value) ? String(value) : value.toFixed(2);
		}
		return String(value);
	}

	function getCellValue(entry: GazeSampleDataEntry | FixationDataEntry | SessionScoreDataEntry, index: number): unknown {
		if (selectedTable) {
			return getCellValueForTable(entry, index, selectedTable);
		}
		return null;
	}

	function getCellValueForTable(entry: GazeSampleDataEntry | FixationDataEntry | SessionScoreDataEntry, index: number, table: 'gazeSamples' | 'fixationData' | 'sessionScores'): unknown {
		if (table === 'gazeSamples') {
			const data = entry as GazeSampleDataEntry;
			const values = [
				data.id, data.child_id, data.session_id, data.task_name, data.slide_index, data.stimulus_id, data.timestamp,
				data.eyetracker_x, data.eyetracker_y, data.aoi, data.mouse_x, data.mouse_y,
				data.events, data.sound_name, data.mistake_type, data.task_result
			];
			return values[index];
		} else if (table === 'fixationData') {
			const data = entry as FixationDataEntry;
			const values = [
				data.id, data.child_id, data.session_id, data.task_name, data.slide_index, data.stimulus_id, data.timestamp,
				data.eyetracker_x, data.eyetracker_y, data.duration, data.aoi, data.fixation_index
			];
			return values[index];
		} else {
			const data = entry as SessionScoreDataEntry;
			const values = [
				data.id, data.child_id, data.session_id, data.task_name, data.slide_index,
				data.stimulus_id, data.timestamp,
				data.error_rate, data.response_time, data.mean_fix_dur, data.fix_count,
				data.aoi_target_fix, data.aoi_field_fix, data.regression_count
			];
			return values[index];
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
			<option value="sessionScores">sessionScores</option>
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
			disabled={!selectedChildId || selectedTable === 'sessionScores'}
			class="px-3 py-1.5 bg-white border border-gray-300 text-gray-800 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed min-w-[200px]"
		>
			<option value="">{selectedTable === 'sessionScores' ? 'N/A for this table' : 'Select session…'}</option>
			{#each sessionIds as session (session.sessionId)}
				<option value={session.sessionId}>[{session.taskName}] {formatTimestamp(parseFloat(String(session.sessionId)), 'simple')}</option>
			{/each}
		</select>
	</div>
</section>

<section class="absolute top-4 right-4 flex gap-4 items-center">
	<button
		class="px-3 py-1.5 bg-blue-500 text-gray-50 rounded-md hover:bg-blue-600 mt-6"
		onclick={() => exportWindowOpen = true}
	>
		Exportovat&hellip;
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
	{:else if !selectedSessionId && selectedTable !== 'sessionScores'}
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

<ExportWindow bind:open={exportWindowOpen} />

<style>
	.table-container{
		height: calc(100vh - 10rem);
	}
</style>

