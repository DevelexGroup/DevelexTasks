<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { db } from '$lib/database/db';
	import type { GazeSampleDataEntry, FixationDataEntry, SessionScoreDataEntry } from '$lib/database/db.types';

	export interface TaskSelectionResult {
		childId: string;
		sessionId: string;
		taskName: string;
		gazeSamples: GazeSampleDataEntry[];
		fixationData: FixationDataEntry[];
		sessionScores: SessionScoreDataEntry[];
		maxSlides: number;
	}

	let {
		open = $bindable(false),
		onConfirm
	}: {
		open?: boolean;
		onConfirm?: (result: TaskSelectionResult) => void;
	} = $props();

	let selectedChildId = $state<string>('');
	let selectedSessionId = $state<string>('');
	let childIds = $state<string[]>([]);
	let sessionIds = $state<{ sessionId: string; taskName: string }[]>([]);
	let isLoading = $state(false);

	// Load child IDs when dialog opens
	$effect(() => {
		if (open) {
			loadChildIds();
		}
	});

	// Load session IDs when child is selected
	$effect(() => {
		if (selectedChildId) {
			loadSessionIds();
			selectedSessionId = '';
		}
	});

	async function loadChildIds() {
		const [gazeChildIds, fixationChildIds, sessionChildIds] = await Promise.all([
			db.gazeSamples.orderBy('child_id').uniqueKeys() as Promise<string[]>,
			db.fixationData.orderBy('child_id').uniqueKeys() as Promise<string[]>,
			db.sessionScores.orderBy('child_id').uniqueKeys() as Promise<string[]>
		]);

		const allChildIds = new Set([...gazeChildIds, ...fixationChildIds, ...sessionChildIds]);
		childIds = Array.from(allChildIds).sort();
	}

	async function loadSessionIds() {
		if (!selectedChildId) return;

		const filtered = await db.gazeSamples
			.where('child_id')
			.equals(selectedChildId)
			.toArray();

		const sessionMap: Record<string, string> = {};
		for (const entry of filtered) {
			if (!(entry.session_id in sessionMap)) {
				sessionMap[entry.session_id] = entry.task_name;
			}
		}

		sessionIds = Object.entries(sessionMap)
			.map(([sessionId, taskName]) => ({ sessionId, taskName }))
			.sort((a, b) => -a.sessionId.localeCompare(b.sessionId));
	}

	function formatTimestamp(unixTimestamp: number): string {
		const date = new Date(Math.floor(unixTimestamp));
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const seconds = String(date.getSeconds()).padStart(2, '0');
		return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
	}

	async function handleConfirm() {
		if (!selectedChildId || !selectedSessionId) return;

		isLoading = true;
		try {
			const [gazeSamples, fixationData, sessionScores] = await Promise.all([
				db.gazeSamples
					.where('[child_id+session_id]')
					.equals([selectedChildId, selectedSessionId])
					.toArray(),
				db.fixationData
					.where('[child_id+session_id]')
					.equals([selectedChildId, selectedSessionId])
					.toArray(),
				db.sessionScores
					.where('[child_id+session_id]')
					.equals([selectedChildId, selectedSessionId])
					.toArray()
			]);

			const taskName = sessionIds.find(s => s.sessionId === selectedSessionId)?.taskName || '';

			const maxSlides = gazeSamples.length > 0 ? Math.max(...gazeSamples.map(s => s.slide_index)) : 0;

			onConfirm?.({
				childId: selectedChildId,
				sessionId: selectedSessionId,
				taskName,
				gazeSamples,
				fixationData,
				sessionScores,
				maxSlides
			});

			open = false;
		} finally {
			isLoading = false;
		}
	}

	function canConfirm(): boolean {
		return !!selectedChildId && !!selectedSessionId;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Výběr heatmapy</Dialog.Title>
			<Dialog.Description>
				Vyberte dítě a session pro zobrazení heatmapy.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<!-- Child ID selector -->
			<div class="space-y-2">
				<label for="childId" class="text-sm font-medium text-gray-700">Child ID:</label>
				<select
					id="childId"
					bind:value={selectedChildId}
					class="w-full px-3 py-2 bg-white border border-gray-300 text-gray-800 rounded-md"
				>
					<option value="">Vyberte dítě…</option>
					{#each childIds as childId (childId)}
						<option value={childId}>{childId}</option>
					{/each}
				</select>
			</div>

			<!-- Session ID selector -->
			<div class="space-y-2">
				<label for="sessionId" class="text-sm font-medium text-gray-700">Session:</label>
				<select
					id="sessionId"
					bind:value={selectedSessionId}
					disabled={!selectedChildId}
					class="w-full px-3 py-2 bg-white border border-gray-300 text-gray-800 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
				>
					<option value="">Vyberte session…</option>
					{#each sessionIds as session (session.sessionId)}
						<option value={session.sessionId}>
							[{session.taskName}] {formatTimestamp(parseFloat(session.sessionId))}
						</option>
					{/each}
				</select>
			</div>
		</div>

		<Dialog.Footer>
			<Dialog.Close>
				<button
					type="button"
					class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
				>
					Zavřít
				</button>
			</Dialog.Close>
			<button
				type="button"
				class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
				disabled={!canConfirm() || isLoading}
				onclick={handleConfirm}
			>
				{isLoading ? 'Načítám…' : 'Zobrazit'}
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
