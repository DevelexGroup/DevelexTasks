<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import {
		DatabaseExporter,
		type ExportMode,
		type SessionInfo
	} from '$lib/utils/databaseExport';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	let exportMode = $state<ExportMode>('all');
	let selectedChildId = $state<string>('');
	let selectedSessionId = $state<string>('');
	let childIds = $state<string[]>([]);
	let sessionIds = $state<SessionInfo[]>([]);
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
		childIds = await DatabaseExporter.getChildIds();
	}

	async function loadSessionIds() {
		if (!selectedChildId) return;
		sessionIds = await DatabaseExporter.getSessionIds(selectedChildId);
	}

	async function exportData() {
		isExporting = true;
		try {
			await DatabaseExporter.exportAndDownload({
				mode: exportMode,
				childId: selectedChildId || undefined,
				sessionId: selectedSessionId || undefined
			});
			open = false;
		} finally {
			isExporting = false;
		}
	}

	function canExport(): boolean {
		return DatabaseExporter.canExport({
			mode: exportMode,
			childId: selectedChildId || undefined,
			sessionId: selectedSessionId || undefined
		});
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
				<label class="flex cursor-pointer items-center gap-3">
					<input
						type="radio"
						name="exportMode"
						value="all"
						bind:group={exportMode}
						class="h-4 w-4 text-blue-600"
					/>
					<div>
						<span class="font-medium">Exportovat vše</span>
						<p class="text-sm text-gray-500">childIds → sessions → tables.csv</p>
					</div>
				</label>

				<label class="flex cursor-pointer items-center gap-3">
					<input
						type="radio"
						name="exportMode"
						value="child"
						bind:group={exportMode}
						class="h-4 w-4 text-blue-600"
					/>
					<div>
						<span class="font-medium">Exportovat dítě</span>
						<p class="text-sm text-gray-500">sessions → tables.csv</p>
					</div>
				</label>

				<label class="flex cursor-pointer items-center gap-3">
					<input
						type="radio"
						name="exportMode"
						value="session"
						bind:group={exportMode}
						class="h-4 w-4 text-blue-600"
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
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
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
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800 disabled:cursor-not-allowed disabled:bg-gray-100"
					>
						<option value="">Vyberte sezení…</option>
						{#each sessionIds as session (session.sessionId)}
							<option value={session.sessionId}>
								[{session.taskName}] {DatabaseExporter.formatTimestamp(parseFloat(session.sessionId), 'simple')}
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
					class="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
				>
					Zrušit
				</button>
			</Dialog.Close>
			<button
				type="button"
				class="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400"
				disabled={!canExport() || isExporting}
				onclick={exportData}
			>
				{isExporting ? 'Exportuji…' : 'Exportovat'}
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
