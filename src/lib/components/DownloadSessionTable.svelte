<script lang="ts">
	import JSZip from 'jszip';
	import pkg from 'file-saver';
	const { saveAs } = pkg;
	import { db } from '$lib/database/database';
	import type { Session } from '$lib/database/models/Session';
	import fixationRepository from '$lib/database/repositories/fixation.repository';
	import saccadeRepository from '$lib/database/repositories/saccade.repository';
	import intersectionRepository from '$lib/database/repositories/intersect.repository';
	import dwellRepository from '$lib/database/repositories/dwell.repository';
	import userEventsRepository from '$lib/database/repositories/userEvents.repository';
	import stateEventsRepository from '$lib/database/repositories/stateEvents.repository';
	import xstateEventsRepository from '$lib/database/repositories/xstateEvents.repository';
	import gazeInputRepository from '$lib/database/repositories/gazeInput.repository';
	import fixationInputRepository from '$lib/database/repositories/fixationInput.repository';

	// Define props with proper typing using $props
	interface SessionWithDate extends Session {
		firstRecordDate: string;
		firstRecordTimestamp: number;
	}

	// Use $props for component props in Svelte 5
	const props = $props<{
		sessionsWithFirstRecord: SessionWithDate[];
	}>();

	// Type for sort configuration
	type SortConfig = {
		key: keyof SessionWithDate;
		direction: 'asc' | 'desc';
	};

	// State management using Svelte 5 runes
	const tableState = $state({
		search: '',
		currentPage: 1,
		itemsPerPage: 10,
		sortConfig: { key: 'firstRecordTimestamp', direction: 'desc' } as SortConfig
	});

	// Helper function to safely check if string includes another string, handling nulls/undefined
	function safeIncludes(text: string | null | undefined, search: string): boolean {
		return typeof text === 'string' ? text.toLowerCase().includes(search) : false;
	}

	// Use $derived.by for computed values with proper typing
	// Filter sessions based on search
	const filteredSessions = $derived.by(() => {
		// Safety check: if sessionsWithFirstRecord is undefined or empty, return empty array
		if (!props.sessionsWithFirstRecord || props.sessionsWithFirstRecord.length === 0) {
			return [] as SessionWithDate[];
		}

		if (!tableState.search.trim()) return props.sessionsWithFirstRecord;

		const searchLower = tableState.search.toLowerCase();
		return props.sessionsWithFirstRecord.filter(
			(session: SessionWithDate) =>
				safeIncludes(session.id, searchLower) ||
				safeIncludes(session.name, searchLower) ||
				safeIncludes(session.userName, searchLower) ||
				safeIncludes(session.firstRecordDate, searchLower)
		);
	}) as SessionWithDate[];

	// Sort filtered sessions
	const sortedSessions = $derived.by(() => {
		if (filteredSessions.length === 0) return [] as SessionWithDate[];

		const { key, direction } = tableState.sortConfig;
		return [...filteredSessions].sort((a, b) => {
			const valueA = a[key] ?? '';
			const valueB = b[key] ?? '';

			// Handle string comparison
			if (typeof valueA === 'string' && typeof valueB === 'string') {
				return direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
			}

			// Handle number comparison
			return direction === 'asc'
				? valueA < valueB
					? -1
					: valueA > valueB
						? 1
						: 0
				: valueB < valueA
					? -1
					: valueB > valueA
						? 1
						: 0;
		});
	}) as SessionWithDate[];

	// Calculate total pages - make sure it returns a number
	const totalPages = $derived.by(() => {
		return Math.ceil(filteredSessions.length / tableState.itemsPerPage) || 1;
	}) as number;

	// Calculate paginated sessions
	const paginatedSessions = $derived.by(() => {
		if (sortedSessions.length === 0) return [] as SessionWithDate[];

		const start = (tableState.currentPage - 1) * tableState.itemsPerPage;
		return sortedSessions.slice(start, start + tableState.itemsPerPage);
	}) as SessionWithDate[];

	// Handle sort
	function handleSort(key: keyof SessionWithDate) {
		// Special case for date sorting - use timestamp for sorting
		const sortKey =
			key === 'firstRecordDate' ? ('firstRecordTimestamp' as keyof SessionWithDate) : key;

		if (tableState.sortConfig.key === sortKey) {
			tableState.sortConfig.direction = tableState.sortConfig.direction === 'asc' ? 'desc' : 'asc';
		} else {
			tableState.sortConfig.key = sortKey;
			tableState.sortConfig.direction = 'asc';
		}

		// Reset to first page when sorting changes
		tableState.currentPage = 1;
	}

	// Page change function
	function changePage(page: number) {
		if (page >= 1 && page <= totalPages) {
			tableState.currentPage = page;
		}
	}

	// Reset pagination when search changes
	$effect(() => {
		// Only this one effect is needed - it watches the search value
		// and resets page when search changes
		const _ = tableState.search;
		tableState.currentPage = 1;
	});

	const downloadAllDataAsZip = async (sessionId: string) => {
		const zip = new JSZip();

		// Fetch data from each table
		const userEvents = await db.userEvents.where('sessionId').equals(sessionId).toArray();
		const stateEvents = await db.stateEvents.where('sessionId').equals(sessionId).toArray();
		const fixations = await db.fixations.where('sessionId').equals(sessionId).toArray();
		const saccades = await db.saccades.where('sessionId').equals(sessionId).toArray();
		const intersects = await db.intersects.where('sessionId').equals(sessionId).toArray();
		const dwells = await db.dwells.where('sessionId').equals(sessionId).toArray();
		const xstateEvents = await db.xstateEvents.where('sessionId').equals(sessionId).toArray();
		const gazeInputs = await db.gazeInputs.where('sessionId').equals(sessionId).toArray();
		const fixationInputs = await db.fixationInputs.where('sessionId').equals(sessionId).toArray();

		// Convert data to CSV using repository-specific methods
		zip.file(
			'userEvents.csv',
			userEventsRepository.csvHeader() +
				'\n' +
				userEvents.map(userEventsRepository.toCsv).join('\n')
		);
		zip.file(
			'stateEvents.csv',
			stateEventsRepository.csvHeader() +
				'\n' +
				stateEvents.map(stateEventsRepository.toCsv).join('\n')
		);
		zip.file(
			'fixations.csv',
			fixationRepository.csvHeader() + '\n' + fixations.map(fixationRepository.toCsv).join('\n')
		);
		zip.file(
			'saccades.csv',
			saccadeRepository.csvHeader() + '\n' + saccades.map(saccadeRepository.toCsv).join('\n')
		);
		zip.file(
			'intersects.csv',
			intersectionRepository.csvHeader() +
				'\n' +
				intersects.map(intersectionRepository.toCsv).join('\n')
		);
		zip.file(
			'dwells.csv',
			dwellRepository.csvHeader() + '\n' + dwells.map(dwellRepository.toCsv).join('\n')
		);
		zip.file(
			'xstateEvents.csv',
			xstateEventsRepository.csvHeader() +
				'\n' +
				xstateEvents.map(xstateEventsRepository.toCsv).join('\n')
		);
		zip.file(
			'gazeInputs.csv',
			gazeInputRepository.csvHeader() +
				'\n' +
				gazeInputs.map((gazeInput) => gazeInputRepository.toCsv(gazeInput)).join('\n')
		);
		zip.file(
			'fixationInputs.csv',
			fixationInputRepository.csvHeader() +
				'\n' +
				fixationInputs.map(fixationInputRepository.toCsv).join('\n')
		);

		// Generate the ZIP file and trigger download
		const content = await zip.generateAsync({ type: 'blob' });
		saveAs(content, `session-${sessionId}.zip`);
	};
</script>

<div class="w-full">
	<!-- Search and pagination controls -->
	<div class="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row">
		<div class="w-full sm:w-64">
			<input
				type="text"
				placeholder="Hledat..."
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
				value={tableState.search}
				oninput={(e) => (tableState.search = e.currentTarget.value)}
			/>
		</div>
		<div class="flex items-center">
			<select
				class="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
				onchange={(e) => {
					tableState.itemsPerPage = Number(e.currentTarget.value);
					tableState.currentPage = 1;
				}}
			>
				<option value="5" selected={tableState.itemsPerPage === 5}>5 / strana</option>
				<option value="10" selected={tableState.itemsPerPage === 10}>10 / strana</option>
				<option value="25" selected={tableState.itemsPerPage === 25}>25 / strana</option>
				<option value="50" selected={tableState.itemsPerPage === 50}>50 / strana</option>
			</select>
		</div>
	</div>

	<!-- Table with responsive styles to prevent horizontal scrolling -->
	<div class="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
		<table class="w-full table-auto">
			<thead class="bg-gray-50">
				<tr>
					<th
						scope="col"
						class="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 hover:bg-gray-100"
						onclick={() => handleSort('id')}
					>
						<div class="flex items-center">
							<span>ID relace</span>
							{#if tableState.sortConfig.key === 'id'}
								<span class="ml-1">{tableState.sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th
						scope="col"
						class="hidden cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 hover:bg-gray-100 md:table-cell"
						onclick={() => handleSort('name')}
					>
						<div class="flex items-center">
							<span>Název úrovně</span>
							{#if tableState.sortConfig.key === 'name'}
								<span class="ml-1">{tableState.sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th
						scope="col"
						class="hidden cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 hover:bg-gray-100 sm:table-cell"
						onclick={() => handleSort('userName')}
					>
						<div class="flex items-center">
							<span>Uživatelské jméno</span>
							{#if tableState.sortConfig.key === 'userName'}
								<span class="ml-1">{tableState.sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th
						scope="col"
						class="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 hover:bg-gray-100"
						onclick={() => handleSort('firstRecordDate')}
					>
						<div class="flex items-center">
							<span>Datum</span>
							{#if tableState.sortConfig.key === 'firstRecordTimestamp'}
								<span class="ml-1">{tableState.sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th
						scope="col"
						class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700"
					>
						Akce
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#if paginatedSessions.length === 0}
					<tr>
						<td colspan="5" class="px-4 py-4 text-center text-sm text-gray-500">
							{tableState.search
								? 'Žádné výsledky pro zadané vyhledávání'
								: 'Žádná data k zobrazení'}
						</td>
					</tr>
				{:else}
					{#each paginatedSessions as session, i}
						<tr class={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
							<td class="max-w-[100px] truncate px-4 py-3 text-sm text-gray-700">
								<span class="block truncate" title={session?.id || ''}>
									{session?.id || ''}
								</span>
							</td>
							<td class="hidden px-4 py-3 text-sm text-gray-700 md:table-cell">
								{session?.name || ''}
							</td>
							<td class="hidden px-4 py-3 text-sm text-gray-700 sm:table-cell">
								{session?.userName || ''}
							</td>
							<td class="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
								{session?.firstRecordDate || ''}
							</td>
							<td class="px-4 py-3 text-sm">
								<button
									class="whitespace-nowrap rounded bg-[#0071bc] px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-[#30c0f2] sm:px-4 sm:py-2"
									onclick={() => downloadAllDataAsZip(session.id)}
								>
									<span class="hidden sm:inline">Stáhnout vše jako</span>
									<span class="sm:hidden">Stáhnout</span> ZIP
								</button>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Mobile view session details (for smaller screens) -->
	<div class="mt-2 md:hidden">
		{#each paginatedSessions as session, i}
			<div
				class="mb-2 rounded-lg border border-gray-200 bg-white p-4 {i % 2 === 1
					? 'bg-gray-50'
					: ''}"
			>
				<div class="mb-2 flex items-center justify-between">
					<h3 class="font-medium text-gray-800">{session?.name || ''}</h3>
					<span class="text-sm text-gray-600">{session?.firstRecordDate || ''}</span>
				</div>
				<div class="mb-1 text-sm text-gray-600">
					<span class="font-medium">Uživatel:</span>
					{session?.userName || ''}
				</div>
				<div class="mb-3 truncate text-sm text-gray-600">
					<span class="font-medium">ID:</span>
					<span title={session?.id || ''}>{session?.id || ''}</span>
				</div>
				<button
					class="w-full rounded bg-[#0071bc] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#30c0f2]"
					onclick={() => downloadAllDataAsZip(session.id)}
				>
					Stáhnout vše jako ZIP
				</button>
			</div>
		{/each}
	</div>

	<!-- Pagination -->
	{#if totalPages > 1}
		<div class="mt-4 flex justify-center">
			<nav class="flex items-center">
				<button
					class="mr-1 rounded-md border border-gray-300 p-2 text-sm hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-50"
					disabled={tableState.currentPage === 1}
					onclick={() => changePage(tableState.currentPage - 1)}
					aria-label="Předchozí stránka"
				>
					&laquo;
				</button>

				<div class="flex flex-wrap">
					{#each Array.from({ length: totalPages }) as _, i}
						{#if totalPages <= 5 || i + 1 === 1 || i + 1 === totalPages || (i + 1 >= tableState.currentPage - 1 && i + 1 <= tableState.currentPage + 1)}
							<button
								class={`mx-1 h-8 w-8 rounded-md border text-sm ${tableState.currentPage === i + 1 ? 'bg-blue-500 text-white' : 'border-gray-300 hover:bg-gray-100'}`}
								onclick={() => changePage(i + 1)}
							>
								{i + 1}
							</button>
						{:else if (i + 1 === tableState.currentPage - 2 || i + 1 === tableState.currentPage + 2) && totalPages > 5}
							<span class="mx-1 flex h-8 w-8 items-center justify-center text-sm text-gray-500">
								...
							</span>
						{/if}
					{/each}
				</div>

				<button
					class="ml-1 rounded-md border border-gray-300 p-2 text-sm hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-50"
					disabled={tableState.currentPage === totalPages}
					onclick={() => changePage(tableState.currentPage + 1)}
					aria-label="Další stránka"
				>
					&raquo;
				</button>
			</nav>
		</div>
	{/if}

	<!-- Status info -->
	<div class="mt-2 text-right text-sm text-gray-500">
		Zobrazeno {paginatedSessions.length} z {filteredSessions.length} záznamů
	</div>
</div>
