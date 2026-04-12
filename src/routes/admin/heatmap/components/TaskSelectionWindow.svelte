<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { db } from '$lib/database/db';
	import type {
		GazeSampleDataEntry,
		FixationDataEntry,
		SessionScoreDataEntry
	} from '$lib/database/db.types';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getAllUsers } from '$lib/api/user-management';
	import {
		getTestSessions,
		getTestSessionDetail,
		downloadTestSessionFile
	} from '$lib/api/test-sessions';
	import { SortBy, SortDirection } from '$lib/types/api.types';
	import type { UserDTO, TestSessionDTO, TestSessionDetailDTO } from '$lib/types/api.types';
	import {
		parseGazeSamplesCsv,
		parseFixationDataCsv,
		parseSessionScoresCsv
	} from '$lib/utils/csvParser';
	import { DatabaseExporter } from '$lib/utils/databaseExport';

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

	// ── Tab state ──
	type DataSource = 'local' | 'remote';
	let dataSource = $state<DataSource>('remote');

	// ── Shared state ──
	let isLoading = $state(false);
	let error = $state('');

	// ── Local (Dexie) state ──
	let selectedChildId = $state<string>('');
	let selectedSessionId = $state<string>('');
	let childIds = $state<string[]>([]);
	let sessionIds = $state<{ sessionId: string; taskName: string }[]>([]);

	// ── Remote (API) state ──
	let remoteUsers = $state<UserDTO[]>([]);
	let remoteSessions = $state<TestSessionDTO[]>([]);
	let selectedRemoteUserId = $state('');
	let selectedRemoteSessionId = $state('');
	let isLoadingUsers = $state(false);
	let isLoadingSessions = $state(false);

	// ── Load data when dialog opens ──
	$effect(() => {
		if (open) {
			error = '';
			if (dataSource === 'local') {
				loadChildIds();
			} else {
				loadRemoteUsers();
			}
		}
	});

	// ── Local: Load session IDs when child is selected ──
	$effect(() => {
		if (selectedChildId) {
			loadSessionIds();
			selectedSessionId = '';
		}
	});

	// ── Remote: Load sessions when user is selected ──
	$effect(() => {
		const uid = selectedRemoteUserId;
		selectedRemoteSessionId = '';
		remoteSessions = [];
		if (uid) {
			loadRemoteSessions(uid);
		}
	});

	// ──────────────────────────────────────────────
	// LOCAL methods
	// ──────────────────────────────────────────────

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

		const filtered = await db.gazeSamples.where('child_id').equals(selectedChildId).toArray();

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

	async function handleLocalConfirm() {
		if (!selectedChildId || !selectedSessionId) return;

		isLoading = true;
		error = '';
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

			const taskName = sessionIds.find((s) => s.sessionId === selectedSessionId)?.taskName || '';
			const maxSlides =
				gazeSamples.length > 0 ? Math.max(...gazeSamples.map((s) => s.slide_index)) : 0;

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
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se načíst data';
		} finally {
			isLoading = false;
		}
	}

	// ──────────────────────────────────────────────
	// REMOTE methods
	// ──────────────────────────────────────────────

	async function loadRemoteUsers() {
		isLoadingUsers = true;
		error = '';
		try {
			const raw = await getAllUsers();
			remoteUsers = raw.slice().sort((a, b) => a.username.localeCompare(b.username, 'cs'));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se načíst uživatele';
		} finally {
			isLoadingUsers = false;
		}
	}

	async function loadRemoteSessions(userId: string) {
		if (!userId) {
			remoteSessions = [];
			return;
		}
		isLoadingSessions = true;
		error = '';
		try {
			const page = await getTestSessions(
				0,
				-1,
				SortBy.SessionStartTime,
				SortDirection.Desc,
				userId
			);
			remoteSessions = page.content;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se načíst sezení';
		} finally {
			isLoadingSessions = false;
		}
	}

	async function handleRemoteConfirm() {
		if (!selectedRemoteUserId || !selectedRemoteSessionId) return;

		isLoading = true;
		error = '';
		try {
			const detail: TestSessionDetailDTO = await getTestSessionDetail(selectedRemoteSessionId);

			// Collect all CSV files from all parts
			const allGazeSamples: GazeSampleDataEntry[] = [];
			const allFixationData: FixationDataEntry[] = [];
			const allSessionScores: SessionScoreDataEntry[] = [];

			// Gather files from parts
			const csvFiles: { fileId: string; fileName: string }[] = [];
			for (const part of detail.parts ?? []) {
				for (const file of part.files ?? []) {
					const lower = file.fileName.toLowerCase();
					if (
						lower.includes('gazesamples') ||
						lower.includes('fixationdata') ||
						lower.includes('sessionscores')
					) {
						csvFiles.push({ fileId: file.id, fileName: file.fileName });
					}
				}
			}

			// Also check top-level files
			for (const file of detail.files ?? []) {
				const lower = file.fileName.toLowerCase();
				if (
					lower.includes('gazesamples') ||
					lower.includes('fixationdata') ||
					lower.includes('sessionscores')
				) {
					// Avoid duplicates
					if (!csvFiles.some((f) => f.fileId === file.id)) {
						csvFiles.push({ fileId: file.id, fileName: file.fileName });
					}
				}
			}

			// Download and parse each CSV
			for (const csvFile of csvFiles) {
				const blob = await downloadTestSessionFile(selectedRemoteSessionId, csvFile.fileId);
				const text = await blob.text();
				const lower = csvFile.fileName.toLowerCase();

				if (lower.includes('gazesamples')) {
					allGazeSamples.push(...parseGazeSamplesCsv(text));
				} else if (lower.includes('fixationdata')) {
					allFixationData.push(...parseFixationDataCsv(text));
				} else if (lower.includes('sessionscores')) {
					allSessionScores.push(...parseSessionScoresCsv(text));
				}
			}

			const user = remoteUsers.find((u) => u.id === selectedRemoteUserId);
			const childId = user?.username ?? selectedRemoteUserId;
			const taskName = detail.testType ?? '';

			const maxSlides =
				allGazeSamples.length > 0
					? Math.max(...allGazeSamples.map((s) => s.slide_index))
					: 0;

			onConfirm?.({
				childId,
				sessionId: selectedRemoteSessionId,
				taskName,
				gazeSamples: allGazeSamples,
				fixationData: allFixationData,
				sessionScores: allSessionScores,
				maxSlides
			});

			open = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se načíst data ze serveru';
		} finally {
			isLoading = false;
		}
	}

	// ──────────────────────────────────────────────
	// Shared helpers
	// ──────────────────────────────────────────────

	function formatTimestamp(unixTimestamp: number): string {
		return DatabaseExporter.formatTimestamp(unixTimestamp, 'simple');
	}

	function formatDate(date: Date | string): string {
		const d = new Date(date);
		return d.toLocaleString('cs-CZ', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function canConfirm(): boolean {
		if (dataSource === 'local') {
			return !!selectedChildId && !!selectedSessionId;
		}
		return !!selectedRemoteUserId && !!selectedRemoteSessionId;
	}

	function handleConfirm() {
		if (dataSource === 'local') {
			handleLocalConfirm();
		} else {
			handleRemoteConfirm();
		}
	}

	function handleEscapeKeydown() {
		goto(resolve('/admin'));
		open = false;
	}

	function handleOpenChange(newOpen: boolean) {
		if (!newOpen) {
			goto(resolve('/admin'));
		}
		open = newOpen;
	}

	function switchTab(tab: DataSource) {
		dataSource = tab;
		error = '';
		if (tab === 'remote' && remoteUsers.length === 0) {
			loadRemoteUsers();
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-md" showCloseButton={false} onEscapeKeydown={handleEscapeKeydown}>
		<Dialog.Header>
			<Dialog.Title>Výběr heatmapy</Dialog.Title>
			<Dialog.Description>Vyberte zdroj dat a session pro zobrazení heatmapy.</Dialog.Description>
		</Dialog.Header>

		<!-- Tab switcher -->
		<div class="flex border-b border-gray-200">
			<button
				type="button"
				class="flex-1 px-4 py-2 text-sm font-medium transition-colors
					{dataSource === 'remote'
					? 'border-b-2 border-blue-500 text-blue-600'
					: 'text-gray-500 hover:text-gray-700'}"
				onclick={() => switchTab('remote')}
			>
				Vzdálený server
			</button>
			<button
				type="button"
				class="flex-1 px-4 py-2 text-sm font-medium transition-colors
					{dataSource === 'local'
					? 'border-b-2 border-blue-500 text-blue-600'
					: 'text-gray-500 hover:text-gray-700'}"
				onclick={() => switchTab('local')}
			>
				Lokální databáze
			</button>
		</div>

		{#if error}
			<div class="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
				{error}
			</div>
		{/if}

		<div class="space-y-4 py-4">
			{#if dataSource === 'local'}
				<!-- ─── Local: Child ID selector ─── -->
				<div class="space-y-2">
					<label for="childId" class="text-sm font-medium text-gray-700">Child ID:</label>
					<select
						id="childId"
						bind:value={selectedChildId}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
					>
						<option value="">Vyberte dítě…</option>
						{#each childIds as childId (childId)}
							<option value={childId}>{childId}</option>
						{/each}
					</select>
				</div>

				<!-- ─── Local: Session ID selector ─── -->
				<div class="space-y-2">
					<label for="sessionId" class="text-sm font-medium text-gray-700">Session:</label>
					<select
						id="sessionId"
						bind:value={selectedSessionId}
						disabled={!selectedChildId}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800 disabled:cursor-not-allowed disabled:bg-gray-100"
					>
						<option value="">Vyberte session…</option>
						{#each sessionIds as session (session.sessionId)}
							<option value={session.sessionId}>
								[{session.taskName}] {formatTimestamp(parseFloat(session.sessionId))}
							</option>
						{/each}
					</select>
				</div>
			{:else}
				<!-- ─── Remote: User selector ─── -->
				<div class="space-y-2">
					<label for="remoteUser" class="text-sm font-medium text-gray-700">Uživatel:</label>
					<select
						id="remoteUser"
						bind:value={selectedRemoteUserId}
						disabled={isLoadingUsers}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800 disabled:cursor-not-allowed disabled:bg-gray-100"
					>
						<option value="">
							{isLoadingUsers ? 'Načítání…' : 'Vyberte uživatele…'}
						</option>
						{#each remoteUsers as user (user.id)}
							<option value={user.id}>
								{user.firstName} {user.lastName} ({user.username})
							</option>
						{/each}
					</select>
				</div>

				<!-- ─── Remote: Session selector ─── -->
				<div class="space-y-2">
					<label for="remoteSession" class="text-sm font-medium text-gray-700">Session:</label>
					<select
						id="remoteSession"
						bind:value={selectedRemoteSessionId}
						disabled={!selectedRemoteUserId || isLoadingSessions || remoteSessions.length === 0}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800 disabled:cursor-not-allowed disabled:bg-gray-100"
					>
						<option value="">
							{#if !selectedRemoteUserId}
								Nejprve vyberte uživatele…
							{:else if isLoadingSessions}
								Načítání…
							{:else if remoteSessions.length === 0}
								Žádná sezení
							{:else}
								Vyberte sezení…
							{/if}
						</option>
						{#each remoteSessions as session (session.id)}
							<option value={session.id}>
								[{session.testType}] {formatDate(session.sessionStartTime)} — {session.status}
								({session.fileCount} souborů)
							</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<button
				type="button"
				class="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
				onclick={() => goto(resolve(`/`))}
			>
				Zpět
			</button>
			<button
				type="button"
				class="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400"
				disabled={!canConfirm() || isLoading}
				onclick={handleConfirm}
			>
				{isLoading ? 'Načítám…' : 'Zobrazit'}
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
