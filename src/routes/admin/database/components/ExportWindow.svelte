<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { db } from '$lib/database/db';
	import type { GazeSampleDataEntry, FixationDataEntry, SessionScoreDataEntry } from '$lib/database/db.types';
	import JSZip from 'jszip';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	type ExportMode = 'all' | 'child' | 'session';
	type TableName = 'gazeSamples' | 'fixationData' | 'sessionScores';

	let exportMode = $state<ExportMode>('all');
	let selectedChildId = $state<string>('');
	let selectedSessionId = $state<string>('');
	let childIds = $state<string[]>([]);
	let sessionIds = $state<{ sessionId: string; taskName: string }[]>([]);
	let isExporting = $state(false);

	// Load child IDs when dialog opens
	$effect(() => {
		if (open) {
			loadChildIds();
		}
	});

	// Load session IDs when child is selected and mode requires it
	$effect(() => {
		if (selectedChildId && exportMode === 'session') {
			loadSessionIds();
		}
	});

	// Reset selections when mode changes
	$effect(() => {
		if (exportMode === 'all') {
			selectedChildId = '';
			selectedSessionId = '';
		} else if (exportMode === 'child') {
			selectedSessionId = '';
		}
	});

	async function loadChildIds() {
		// Get unique child IDs from all tables
		const [gazeChildIds, fixationChildIds, sessionChildIds] = await Promise.all([
			db.gazeSamples.orderBy('child_id').uniqueKeys() as Promise<string[]>,
			db.fixationData.orderBy('child_id').uniqueKeys() as Promise<string[]>,
			db.sessionScores.orderBy('child_id').uniqueKeys() as Promise<string[]>
		]);

		// Merge and deduplicate
		const allChildIds = new Set([...gazeChildIds, ...fixationChildIds, ...sessionChildIds]);
		childIds = Array.from(allChildIds).sort();
	}

	async function loadSessionIds() {
		if (!selectedChildId) return;

		// Get sessions from gazeSamples (most likely to have all sessions)
		const filtered = await db.gazeSamples
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

		const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
		const microseconds = String(Math.floor((unixTimestamp % 1) * 1000)).padStart(3, '0');
		return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}.${milliseconds}${microseconds}`;
	}

	function getExportHeadersForTable(table: TableName): string[] {
		if (table === 'gazeSamples') {
			return ['ID', 'Child ID', 'Session ID', 'Task', 'Slide Index', 'Stimulus ID', 'Timestamp', 'Eye X', 'Eye Y', 'AOI', 'Mouse X', 'Mouse Y', 'Event', 'Sound', 'Mistake Type', 'Result'];
		} else if (table === 'fixationData') {
			return ['ID', 'Child ID', 'Session ID', 'Task', 'Slide Index', 'Stimulus ID', 'Timestamp', 'Eye X', 'Eye Y', 'Duration', 'AOI', 'Fixation Index'];
		} else {
			return ['ID', 'Child ID', 'Session ID', 'Task', 'Slide Index', 'Stimulus ID', 'Timestamp', 'Fluency Score', 'Error Rate', 'Response Time', 'Mean Fixation Duration', 'Fixation Count', 'AOI Target Fixations', 'AOI Field Fixations', 'Regression Count'];
		}
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

	function getCellValueForTable(entry: GazeSampleDataEntry | FixationDataEntry | SessionScoreDataEntry, index: number, table: TableName): unknown {
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
				data.stimulus_id, data.timestamp, data.fluency_score,
				data.error_rate, data.response_time, data.mean_fix_dur, data.fix_count,
				data.aoi_target_fix, data.aoi_field_fix, data.regression_count
			];
			return values[index];
		}
	}

	function createCsvContent(entries: (GazeSampleDataEntry | FixationDataEntry | SessionScoreDataEntry)[], tableName: TableName): string {
		const headers = getExportHeadersForTable(tableName);
		const csvRows = [headers.join(',')];

		const sortedEntries = entries.sort((a, b) => a.timestamp - b.timestamp);
		sortedEntries.forEach(entry => {
			const row = headers.map((column, index) => {
				const value = getCellValueForTable(entry, index, tableName);
				const formatted = formatExportedColumnValue(column, value);
				return formatted.includes(',') ? `"${formatted.replace(/"/g, '""')}"` : formatted;
			});
			csvRows.push(row.join(','));
		});

		return csvRows.join('\n');
	}

	async function exportData() {
		isExporting = true;
		try {
			const zip = new JSZip();
			const tables: TableName[] = ['gazeSamples', 'fixationData', 'sessionScores'];

			if (exportMode === 'all') {
				// Export all: root -> childIds -> sessions -> tables.csv
				for (const tableName of tables) {
					const allData = await db[tableName].toArray();

					// Group by child_id, then by session_id
					const byChild = new Map<string, Map<string, (GazeSampleDataEntry | FixationDataEntry | SessionScoreDataEntry)[]>>();

					allData.forEach(entry => {
						if (!byChild.has(entry.child_id)) {
							byChild.set(entry.child_id, new Map());
						}
						const childMap = byChild.get(entry.child_id)!;
						if (!childMap.has(entry.session_id)) {
							childMap.set(entry.session_id, []);
						}
						childMap.get(entry.session_id)!.push(entry);
					});

					for (const [childId, sessions] of byChild) {
						for (const [sessionId, entries] of sessions) {
							const taskName = entries[0]?.task_name || 'unknown';
							const formattedSessionId = formatTimestamp(parseFloat(sessionId), 'filename');
							const folderPath = `${childId}/${formattedSessionId}_${taskName}`;
							const csvContent = createCsvContent(entries, tableName);
							zip.file(`${folderPath}/${tableName}.csv`, csvContent);
						}
					}
				}
			} else if (exportMode === 'child') {
				// Export child: root -> sessions -> tables.csv
				for (const tableName of tables) {
					const allData = await db[tableName]
						.where('child_id')
						.equals(selectedChildId)
						.toArray();

					// Group by session_id
					const bySession = new Map<string, (GazeSampleDataEntry | FixationDataEntry | SessionScoreDataEntry)[]>();

					allData.forEach(entry => {
						if (!bySession.has(entry.session_id)) {
							bySession.set(entry.session_id, []);
						}
						bySession.get(entry.session_id)!.push(entry);
					});

					for (const [sessionId, entries] of bySession) {
						const taskName = entries[0]?.task_name || 'unknown';
						const formattedSessionId = formatTimestamp(parseFloat(sessionId), 'filename');
						const folderPath = `${formattedSessionId}_${taskName}`;
						const csvContent = createCsvContent(entries, tableName);
						zip.file(`${folderPath}/${tableName}.csv`, csvContent);
					}
				}
			} else {
				// Export session: root -> tables.csv
				for (const tableName of tables) {
					const allData = await db[tableName]
						.where('[child_id+session_id]')
						.equals([selectedChildId, selectedSessionId])
						.toArray();

					if (allData.length > 0) {
						const csvContent = createCsvContent(allData, tableName);
						zip.file(`${tableName}.csv`, csvContent);
					}
				}
			}

			// Generate filename based on export mode
			let filename: string;
			const timestamp = formatTimestamp(Date.now(), 'filename');
			if (exportMode === 'all') {
				filename = `database_export_${timestamp}.zip`;
			} else if (exportMode === 'child') {
				filename = `export_${selectedChildId}_${timestamp}.zip`;
			} else {
				const sessionInfo = sessionIds.find(s => s.sessionId === selectedSessionId);
				const taskName = sessionInfo?.taskName || 'unknown';
				const formattedSessionId = formatTimestamp(parseFloat(selectedSessionId), 'filename');
				filename = `export_${selectedChildId}_${taskName}_${formattedSessionId}.zip`;
			}

			const content = await zip.generateAsync({ type: 'blob' });
			const link = document.createElement('a');
			const url = URL.createObjectURL(content);
			link.setAttribute('href', url);
			link.setAttribute('download', filename);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			open = false;
		} finally {
			isExporting = false;
		}
	}

	function canExport(): boolean {
		if (exportMode === 'all') return true;
		if (exportMode === 'child') return !!selectedChildId;
		if (exportMode === 'session') return !!selectedChildId && !!selectedSessionId;
		return false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Exportovat databázi</Dialog.Title>
			<Dialog.Description>
				Vyberte rozsah exportu. Data budou exportována jako ZIP archiv.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<!-- Export mode selection -->
			<div class="space-y-3">
				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="radio"
						name="exportMode"
						value="all"
						bind:group={exportMode}
						class="w-4 h-4 text-blue-600"
					/>
					<div>
						<span class="font-medium">Exportovat vše</span>
						<p class="text-sm text-gray-500">childIds → sessions → tables.csv</p>
					</div>
				</label>

				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="radio"
						name="exportMode"
						value="child"
						bind:group={exportMode}
						class="w-4 h-4 text-blue-600"
					/>
					<div>
						<span class="font-medium">Exportovat dítě</span>
						<p class="text-sm text-gray-500">sessions → tables.csv</p>
					</div>
				</label>

				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="radio"
						name="exportMode"
						value="session"
						bind:group={exportMode}
						class="w-4 h-4 text-blue-600"
					/>
					<div>
						<span class="font-medium">Exportovat konkrétní sezení</span>
						<p class="text-sm text-gray-500">tables.csv</p>
					</div>
				</label>
			</div>

			<!-- Child ID selector -->
			{#if exportMode === 'child' || exportMode === 'session'}
				<div class="space-y-2">
					<label for="exportChildId" class="text-sm font-medium text-gray-700">Child ID:</label>
					<select
						id="exportChildId"
						bind:value={selectedChildId}
						class="w-full px-3 py-2 bg-white border border-gray-300 text-gray-800 rounded-md"
					>
						<option value="">Vyberte dítě…</option>
						{#each childIds as childId (childId)}
							<option value={childId}>{childId}</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- Session ID selector -->
			{#if exportMode === 'session'}
				<div class="space-y-2">
					<label for="exportSessionId" class="text-sm font-medium text-gray-700">Session:</label>
					<select
						id="exportSessionId"
						bind:value={selectedSessionId}
						disabled={!selectedChildId}
						class="w-full px-3 py-2 bg-white border border-gray-300 text-gray-800 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
					>
						<option value="">Vyberte sezení…</option>
						{#each sessionIds as session (session.sessionId)}
							<option value={session.sessionId}>
								[{session.taskName}] {formatTimestamp(parseFloat(session.sessionId), 'simple')}
							</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Dialog.Close>
				<button
					type="button"
					class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
				>
					Zrušit
				</button>
			</Dialog.Close>
			<button
				type="button"
				class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
				disabled={!canExport() || isExporting}
				onclick={exportData}
			>
				{isExporting ? 'Exportuji…' : 'Exportovat'}
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

