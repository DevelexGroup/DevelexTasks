<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { getAllUsers } from '$lib/api/user-management';
	import {
		getTestSessions,
		getTestSessionDetail,
		downloadTestSessionFile,
		downloadSessionAsZip
	} from '$lib/api/test-sessions';
	import { SortBy, SortDirection } from '$lib/types/api.types';
	import type {
		UserDTO,
		TestSessionDTO,
		TestSessionDetailDTO,
		TestFileDTO
	} from '$lib/types/api.types';

	// State
	let users = $state<UserDTO[]>([]);
	let sessions = $state<TestSessionDTO[]>([]);
	let sessionDetail = $state<TestSessionDetailDTO | null>(null);

	let selectedUserId = $state('');
	let selectedSessionId = $state('');

	let isLoadingUsers = $state(true);
	let isLoadingSessions = $state(false);
	let isLoadingDetail = $state(false);
	let isDownloading = $state(false);
	let error = $state('');

	onMount(() => {
		loadUsers();
	});

	async function loadUsers() {
		isLoadingUsers = true;
		error = '';
		try {
			const raw = await getAllUsers();
			users = raw.slice().sort((a, b) => a.username.localeCompare(b.username, 'cs'));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se načíst uživatele';
		} finally {
			isLoadingUsers = false;
		}
	}

	async function loadSessions(userId: string) {
		if (!userId) {
			sessions = [];
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
			sessions = page.content;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se načíst sezení';
		} finally {
			isLoadingSessions = false;
		}
	}

	async function loadSessionDetail(sessionId: string) {
		if (!sessionId) {
			sessionDetail = null;
			return;
		}
		isLoadingDetail = true;
		error = '';
		try {
			sessionDetail = await getTestSessionDetail(sessionId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se načíst detail sezení';
		} finally {
			isLoadingDetail = false;
		}
	}

	// React to user selection
	$effect(() => {
		const uid = selectedUserId;
		selectedSessionId = '';
		sessionDetail = null;
		sessions = [];
		if (uid) {
			loadSessions(uid);
		}
	});

	// React to session selection
	$effect(() => {
		const sid = selectedSessionId;
		sessionDetail = null;
		if (sid) {
			loadSessionDetail(sid);
		}
	});

	function getAllFiles(): { file: TestFileDTO; partNumber: number }[] {
		if (!sessionDetail?.parts) return [];
		return sessionDetail.parts.flatMap((part) =>
			(part.files ?? []).map((file) => ({ file, partNumber: part.partNumber }))
		);
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
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

	async function downloadSingleFile(fileId: string, fileName: string) {
		if (!selectedSessionId) return;
		try {
			const blob = await downloadTestSessionFile(selectedSessionId, fileId);
			triggerDownload(blob, fileName);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se stáhnout soubor';
		}
	}

	async function downloadAllAsZip() {
		if (!selectedSessionId || !sessionDetail) return;

		isDownloading = true;
		error = '';
		try {
			const blob = await downloadSessionAsZip(selectedSessionId);

			const user = users.find((u) => u.id === selectedUserId);
			const userName = user ? `${user.firstName}_${user.lastName}` : selectedUserId;
			const sessionStart = sessionDetail.sessionStartTime
				? new Date(sessionDetail.sessionStartTime)
						.toISOString()
						.replace(/[:.]/g, '-')
						.slice(0, 19)
				: 'unknown';
			const zipName = `${userName}_${sessionDetail.testType}_${sessionStart}.zip`;

			triggerDownload(blob, zipName);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se stáhnout ZIP archiv';
		} finally {
			isDownloading = false;
		}
	}

	function triggerDownload(blob: Blob, fileName: string) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function getFileIcon(fileType: string): string {
		if (!fileType) return 'material-symbols:file-present-outline';
		if (fileType.startsWith('image/')) return 'material-symbols:image-outline';
		if (fileType.startsWith('video/')) return 'material-symbols:videocam-outline';
		if (fileType.startsWith('audio/')) return 'material-symbols:audio-file-outline';
		if (fileType.includes('pdf')) return 'material-symbols:picture-as-pdf-outline';
		if (fileType.includes('zip') || fileType.includes('archive') || fileType.includes('compressed'))
			return 'material-symbols:folder-zip-outline';
		if (fileType.includes('json') || fileType.includes('xml') || fileType.includes('text'))
			return 'material-symbols:description-outline';
		return 'material-symbols:file-present-outline';
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'COMPLETED':
				return 'bg-green-100 text-green-700';
			case 'IN_PROGRESS':
				return 'bg-blue-100 text-blue-700';
			case 'ABANDONED':
				return 'bg-amber-100 text-amber-700';
			case 'ERROR':
				return 'bg-red-100 text-red-700';
			default:
				return 'bg-gray-100 text-gray-700';
		}
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'COMPLETED':
				return 'Dokončeno';
			case 'IN_PROGRESS':
				return 'Probíhá';
			case 'ABANDONED':
				return 'Opuštěno';
			case 'ABORTED':
				return 'Přerušeno';
			case 'ERROR':
				return 'Chyba';
			default:
				return status;
		}
	}
</script>

<svelte:head>
	<title>Soubory sezení - DeveLex Tasks</title>
</svelte:head>

<!-- Header selectors -->
<section class="fixed top-0 right-0 left-0 z-10 bg-gray-100 px-4 pt-4 pb-3 shadow-sm">
	<div class="mx-auto max-w-5xl">
		<div class="flex flex-wrap items-end gap-4">
		<div class="flex flex-col gap-1">
			<label for="userSelect" class="text-xs font-semibold text-gray-500 uppercase">Uživatel</label>
			<select
				id="userSelect"
				bind:value={selectedUserId}
				disabled={isLoadingUsers}
				class="min-w-56 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800 disabled:cursor-not-allowed disabled:bg-gray-100"
			>
				<option value="">
					{isLoadingUsers ? 'Načítání…' : 'Vyberte uživatele…'}
				</option>
				{#each users as user (user.id)}
					<option value={user.id}>
						{user.firstName} {user.lastName} ({user.username})
					</option>
				{/each}
			</select>
		</div>

		<div class="flex flex-col gap-1">
			<label for="sessionSelect" class="text-xs font-semibold text-gray-500 uppercase">Sezení</label>
			<select
				id="sessionSelect"
				bind:value={selectedSessionId}
				disabled={!selectedUserId || isLoadingSessions || sessions.length === 0}
				class="min-w-72 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800 disabled:cursor-not-allowed disabled:bg-gray-100"
			>
				<option value="">
					{#if !selectedUserId}
						Nejprve vyberte uživatele…
					{:else if isLoadingSessions}
						Načítání…
					{:else if sessions.length === 0}
						Žádná sezení
					{:else}
						Vyberte sezení…
					{/if}
				</option>
				{#each sessions as session (session.id)}
					<option value={session.id}>
						[{session.testType}] {formatDate(session.sessionStartTime)} — {session.status}
						({session.fileCount} souborů)
					</option>
				{/each}
			</select>
		</div>
		</div>
	</div>
</section>

<!-- Main content -->
<section class="content-area mt-24 mb-16 overflow-auto bg-gray-100 px-4">
	<div class="mx-auto max-w-5xl py-2">
		{#if error}
		<div class="flex h-full flex-col items-center justify-center gap-4">
			<p class="text-lg text-red-500">{error}</p>
			<button
				class="rounded-md bg-blue-500 px-3 py-1.5 text-white hover:bg-blue-600"
				onclick={() => {
					error = '';
					if (selectedSessionId) loadSessionDetail(selectedSessionId);
					else if (selectedUserId) loadSessions(selectedUserId);
					else loadUsers();
				}}
			>
				Zkusit znovu
			</button>
		</div>
	{:else if !selectedUserId}
		<div class="flex h-full items-center justify-center">
			<p class="text-lg text-gray-500">Vyberte uživatele pro zobrazení sezení</p>
		</div>
	{:else if isLoadingSessions}
		<div class="flex h-full items-center justify-center">
			<p class="text-lg text-gray-500">Načítání sezení…</p>
		</div>
	{:else if !selectedSessionId}
		<div class="flex h-full items-center justify-center">
			<p class="text-lg text-gray-500">
				{sessions.length === 0 ? 'Uživatel nemá žádná sezení' : 'Vyberte sezení'}
			</p>
		</div>
	{:else if isLoadingDetail}
		<div class="flex h-full items-center justify-center">
			<p class="text-lg text-gray-500">Načítání souborů…</p>
		</div>
	{:else if sessionDetail}
		{@const allFiles = getAllFiles()}

		<!-- Session summary card -->
		<div class="mb-6 rounded-xl bg-white p-5 shadow-md shadow-gray-300/50">
			<div class="flex flex-wrap items-center justify-between gap-4">
				<div class="flex items-center gap-4">
					<div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100">
						<Icon icon="material-symbols:lab-profile-outline" class="h-6 w-6 text-violet-700" />
					</div>
					<div>
						<h2 class="text-lg font-bold text-gray-800">{sessionDetail.testType}</h2>
						<p class="text-sm text-gray-500">
							{sessionDetail.userFullName} &middot; {formatDate(sessionDetail.sessionStartTime)}
						</p>
					</div>
					<span class="rounded-full px-3 py-1 text-xs font-semibold {getStatusColor(sessionDetail.status)}">
						{getStatusLabel(sessionDetail.status)}
					</span>
				</div>
				<button
					class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
					disabled={isDownloading || allFiles.length === 0}
					onclick={downloadAllAsZip}
				>
					{#if isDownloading}
						<Icon icon="mdi:loading" class="h-5 w-5 animate-spin" />
						Stahuji…
					{:else}
						<Icon icon="material-symbols:download" class="h-5 w-5" />
						Stáhnout vše jako ZIP
					{/if}
				</button>
			</div>
			<div class="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-gray-100 pt-3 text-sm text-gray-500">
				<span>
					<Icon icon="material-symbols:layers-outline" class="mr-1 inline h-4 w-4 align-text-bottom" />
					{sessionDetail.partCount} {sessionDetail.partCount === 1 ? 'část' : 'částí'}
				</span>
				<span>
					<Icon icon="material-symbols:attach-file" class="mr-1 inline h-4 w-4 align-text-bottom" />
					{allFiles.length} {allFiles.length === 1 ? 'soubor' : 'souborů'}
				</span>
				{#if sessionDetail.sessionEndTime}
					<span>
						<Icon icon="material-symbols:timer-outline" class="mr-1 inline h-4 w-4 align-text-bottom" />
						Ukončeno: {formatDate(sessionDetail.sessionEndTime)}
					</span>
				{/if}
			</div>
		</div>

		{#if allFiles.length === 0}
			<div class="flex h-48 items-center justify-center rounded-xl bg-white shadow-md shadow-gray-300/50">
				<p class="text-lg text-gray-400">Toto sezení nemá žádné soubory</p>
			</div>
		{:else}
			<!-- Parts side by side with wrapping, files stacked vertically -->
			<div class="flex flex-wrap gap-5">
				{#each sessionDetail.parts as part (part.id)}
					<div class="flex w-80 flex-col rounded-xl bg-white shadow-md shadow-gray-300/50">
						<!-- Part header -->
						<div class="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
							<div class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100">
								<span class="text-sm font-bold text-indigo-700">{part.partNumber}</span>
							</div>
							<div class="min-w-0 flex-1">
								<span class="text-sm font-semibold text-gray-800">Část {part.partNumber}</span>
								{#if part.startTime}
									<span class="ml-1 text-xs text-gray-400">{formatDate(part.startTime)}</span>
								{/if}
							</div>
							<span class="shrink-0 text-xs text-gray-400">
								{(part.files ?? []).length} souborů
							</span>
						</div>

						<!-- File list (stacked) -->
						{#if (part.files ?? []).length === 0}
							<div class="px-4 py-6 text-center text-sm text-gray-400">
								Žádné soubory
							</div>
						{:else}
							<div class="flex flex-col divide-y divide-gray-50 p-2">
								{#each part.files as file (file.id)}
									<div
										class="group flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-gray-50"
									>
										<div class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600">
											<Icon icon={getFileIcon(file.fileType)} class="h-5 w-5" />
										</div>
										<div class="min-w-0 flex-1">
											<p class="truncate text-sm font-medium text-gray-800" title={file.fileName}>
												{file.fileName}
											</p>
											<div class="flex flex-wrap gap-x-3 text-xs text-gray-400">
												<span>{formatFileSize(file.originalSize ?? file.fileSize)}</span>
												{#if file.createdAt}
													<span>{formatDate(file.createdAt)}</span>
												{/if}
											</div>
										</div>
										<button
											class="inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700"
											onclick={() => downloadSingleFile(file.id, file.fileName)}
										>
											<Icon icon="material-symbols:download" class="h-4 w-4" />
											Stáhnout
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
		{/if}
	</div>
</section>

<!-- Back button -->
<div class="fixed bottom-4 left-4 flex gap-1">
	<button
		class="rounded-md bg-gray-300 px-3 py-1.5 text-gray-800"
		onclick={() => goto(resolve('/'))}
	>
		Zpět
	</button>
</div>

<!-- File count -->
<div class="fixed right-4 bottom-4 flex gap-1">
	{#if sessionDetail}
		<span class="text-gray-700">Celkem souborů: {getAllFiles().length}</span>
	{/if}
</div>

<style>
	.content-area {
		height: calc(100vh - 6rem);
	}
</style>


