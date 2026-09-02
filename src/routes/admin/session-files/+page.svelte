<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';
	import Icon from '@iconify/svelte';
	import DefaultLayout from '$lib/components/layout/DefaultLayout.svelte';
	import BackButton from '$lib/components/layout/BackButton.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { getAllUsers } from '$lib/api/user-management';
	import { getMyGroupMembers } from '$lib/api/groups';
	import { hasCapability } from '$lib/utils/capabilityGuard';
	import { authUser } from '$lib/stores/auth';
	import { triggerUrlDownload } from '$lib/utils/download';
	import {
		getTestSessions,
		getTestSessionDetail,
		getSessionCountsPerUser,
		downloadTestSessionFile,
		prepareSessionExport,
		getExportDownloadUrl,
		deleteTestSession,
		snapToCommonRate,
		type RecalculationScope
	} from '$lib/api/test-sessions';
	import RecalculateDialog from './components/RecalculateDialog.svelte';
	import { PartType, SortBy, SortDirection, UserRole, roleLabels } from '$lib/types/api.types';
	import type {
		UserDTO,
		TestSessionDTO,
		TestSessionDetailDTO,
		TestSessionPartDTO,
		TestFileDTO
	} from '$lib/types/api.types';
	import { SESSION_META_FILE_NAME, type SessionMeta } from '$lib/utils/sessionMeta';
	import {
		formatDate,
		formatDayHeading,
		formatTime,
		getStatusColor,
		getStatusLabel,
		modeColors,
		modeLabels,
		sessionMode,
		taskLabel,
		userDisplayName,
		type SessionMode
	} from '$lib/utils/sessionLabels';

	const roleFilterOrder = [UserRole.Student, UserRole.Supervisor, UserRole.Admin];
	const modeFilterOrder: SessionMode[] = ['reeducation', 'evaluation', 'intervention'];
	const statusFilterOrder = ['COMPLETED', 'IN_PROGRESS', 'ABANDONED', 'ABORTED', 'ERROR'];

	// State
	let users = $state<UserDTO[]>([]);
	let sessionCounts = $state<Record<string, number>>({});
	let countsLoaded = $state(false);
	let userSearch = $state('');
	let selectedRoles = $state<UserRole[]>([...roleFilterOrder]);
	let hideEmptyUsers = $state(false);
	let filterMenuOpen = $state(false);
	let filterMenuRef = $state<HTMLDivElement | null>(null);
	let userSelectMode = $state(false);
	let selectedUserIds = $state<string[]>([]);
	let activeUser = $state<UserDTO | null>(null);

	let sessions = $state<TestSessionDTO[]>([]);
	let sessionSelectMode = $state(false);
	let selectedSessionIds = $state<string[]>([]);
	let hiddenTasks = $state<string[]>([]);
	let hiddenModes = $state<SessionMode[]>([]);
	let hiddenStatuses = $state<string[]>([]);
	let sessionFilterMenuOpen = $state(false);
	let sessionFilterMenuRef = $state<HTMLDivElement | null>(null);
	let activeSessionId = $state('');
	let sessionDetail = $state<TestSessionDetailDTO | null>(null);
	let sessionMeta = $state<SessionMeta | null>(null);

	const metaPart = $derived<TestSessionPartDTO | null>(
		sessionDetail?.parts?.find((p) => p.partType === PartType.Meta) ?? null
	);
	const slideParts = $derived<TestSessionPartDTO[]>(
		sessionDetail?.parts?.filter((p) => p.partType !== PartType.Meta) ?? []
	);

	let isLoadingUsers = $state(true);
	let isLoadingSessions = $state(false);
	let isLoadingDetail = $state(false);
	let isExporting = $state(false);
	let isDownloading = $state(false);
	let isDeleting = $state(false);
	let deleteDialogOpen = $state(false);
	let dialogError = $state('');
	let menuOpen = $state(false);
	let menuRef = $state<HTMLDivElement | null>(null);
	let globalMenuOpen = $state(false);
	let globalMenuRef = $state<HTMLDivElement | null>(null);
	let openUserMenuId = $state('');
	let openSessionMenuId = $state('');
	let recalcDialogOpen = $state(false);
	let recalcScope = $state<RecalculationScope>({});
	let error = $state('');
	let successMessage = $state('');
	let successTimeout: ReturnType<typeof setTimeout> | undefined;

	function showSuccess(message: string) {
		successMessage = message;
		clearTimeout(successTimeout);
		successTimeout = setTimeout(() => (successMessage = ''), 4000);
	}

	onDestroy(() => clearTimeout(successTimeout));

	let canManageSessions = $derived(hasCapability($authUser, 'SESSION_MANAGE_ALL'));

	let filteredUsers = $derived.by(() => {
		const query = userSearch.trim().toLowerCase();
		return users.filter(
			(u) =>
				selectedRoles.includes(u.role) &&
				(!hideEmptyUsers || !countsLoaded || (sessionCounts[u.id] ?? 0) > 0) &&
				(!query ||
					`${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase().includes(query) ||
					u.username.toLowerCase().includes(query))
		);
	});

	let filtersActive = $derived(hideEmptyUsers || selectedRoles.length !== roleFilterOrder.length);

	let selectableUsers = $derived(
		filteredUsers.filter((u) => !countsLoaded || (sessionCounts[u.id] ?? 0) > 0)
	);
	let allUsersSelected = $derived(
		selectableUsers.length > 0 && selectableUsers.every((u) => selectedUserIds.includes(u.id))
	);

	let filteredSessions = $derived(
		sessions.filter(
			(s) =>
				!hiddenTasks.includes(taskLabel(s.testType)) &&
				!hiddenModes.includes(sessionMode(s.testType)) &&
				!hiddenStatuses.includes(s.status)
		)
	);

	let sessionFiltersActive = $derived(
		hiddenTasks.length > 0 || hiddenModes.length > 0 || hiddenStatuses.length > 0
	);

	let availableTasks = $derived(
		[...new Set(sessions.map((s) => taskLabel(s.testType)))].sort((a, b) =>
			a.localeCompare(b, 'cs')
		)
	);
	let availableModes = $derived(
		modeFilterOrder.filter((m) => sessions.some((s) => sessionMode(s.testType) === m))
	);
	let availableStatuses = $derived.by(() => {
		const present = new Set<string>(sessions.map((s) => s.status));
		return [
			...statusFilterOrder.filter((s) => present.has(s)),
			...[...present].filter((s) => !statusFilterOrder.includes(s))
		];
	});

	let selectableSessions = $derived(filteredSessions.filter((s) => s.fileCount > 0));
	let allSessionsSelected = $derived(
		selectableSessions.length > 0 &&
			selectableSessions.every((s) => selectedSessionIds.includes(s.id))
	);

	let sessionGroups = $derived.by(() => {
		const groups: { label: string; sessions: TestSessionDTO[] }[] = [];
		for (const session of filteredSessions) {
			const label = formatDayHeading(session.sessionStartTime);
			const last = groups[groups.length - 1];
			if (last && last.label === label) {
				last.sessions.push(session);
			} else {
				groups.push({ label, sessions: [session] });
			}
		}
		return groups;
	});

	function handleWindowClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (menuOpen && menuRef && !menuRef.contains(target)) {
			menuOpen = false;
		}
		if (globalMenuOpen && globalMenuRef && !globalMenuRef.contains(target)) {
			globalMenuOpen = false;
		}
		if (filterMenuOpen && filterMenuRef && !filterMenuRef.contains(target)) {
			filterMenuOpen = false;
		}
		if (sessionFilterMenuOpen && sessionFilterMenuRef && !sessionFilterMenuRef.contains(target)) {
			sessionFilterMenuOpen = false;
		}
		if ((openUserMenuId || openSessionMenuId) && !target.closest('[data-row-menu]')) {
			openUserMenuId = '';
			openSessionMenuId = '';
		}
	}

	function handleWindowKey(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			menuOpen = false;
			globalMenuOpen = false;
			filterMenuOpen = false;
			sessionFilterMenuOpen = false;
			openUserMenuId = '';
			openSessionMenuId = '';
		}
	}

	onMount(() => {
		loadUsers();
		loadCounts();
	});

	async function loadUsers() {
		isLoadingUsers = true;
		error = '';
		try {
			const raw = hasCapability($authUser, 'USER_READ_ALL')
				? await getAllUsers()
				: await getMyGroupMembers();
			users = raw.slice().sort((a, b) => a.username.localeCompare(b.username, 'cs'));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se načíst uživatele';
		} finally {
			isLoadingUsers = false;
		}
	}

	async function loadCounts() {
		try {
			sessionCounts = await getSessionCountsPerUser();
			countsLoaded = true;
		} catch {
			countsLoaded = false;
		}
	}

	async function loadSessions(userId: string) {
		isLoadingSessions = true;
		error = '';
		try {
			const all: TestSessionDTO[] = [];
			let page = 0;
			for (;;) {
				const result = await getTestSessions(
					page,
					-1,
					SortBy.SessionStartTime,
					SortDirection.Desc,
					userId
				);
				all.push(...result.content);
				if (result.last || result.content.length === 0) break;
				page += 1;
			}
			sessions = all;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se načíst sezení';
		} finally {
			isLoadingSessions = false;
		}
	}

	async function loadSessionDetail(sessionId: string) {
		isLoadingDetail = true;
		error = '';
		sessionMeta = null;
		try {
			sessionDetail = await getTestSessionDetail(sessionId);
			loadSessionMeta(sessionId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se načíst detail sezení';
		} finally {
			isLoadingDetail = false;
		}
	}

	/** meta.json is small; its contents drive the summary shown in the meta panel. */
	async function loadSessionMeta(sessionId: string) {
		const file = metaPart?.files?.find((f) => f.fileName === SESSION_META_FILE_NAME);
		if (!file) return;
		try {
			const blob = await downloadTestSessionFile(sessionId, file.id);
			const parsed = JSON.parse(await blob.text());
			// Files written by an older or partial run stay unread rather than breaking the panel.
			sessionMeta = isRenderableMeta(parsed) ? parsed : null;
		} catch {
			sessionMeta = null;
		}
	}

	function isRenderableMeta(value: unknown): value is SessionMeta {
		const meta = value as SessionMeta | null;
		return (
			!!meta &&
			meta.metaVersion === 1 &&
			!!meta.app &&
			!!meta.session &&
			!!meta.screen &&
			!!meta.viewport &&
			!!meta.browser &&
			!!meta.tracker?.signal
		);
	}

	function resetSessionFilters() {
		hiddenTasks = [];
		hiddenModes = [];
		hiddenStatuses = [];
		sessionFilterMenuOpen = false;
	}

	function openUser(user: UserDTO) {
		activeUser = user;
		sessions = [];
		sessionSelectMode = false;
		selectedSessionIds = [];
		resetSessionFilters();
		activeSessionId = '';
		sessionDetail = null;
		loadSessions(user.id);
	}

	function closeUser() {
		activeUser = null;
		sessions = [];
		sessionSelectMode = false;
		selectedSessionIds = [];
		resetSessionFilters();
		error = '';
	}

	function openSession(sessionId: string) {
		activeSessionId = sessionId;
		sessionDetail = null;
		loadSessionDetail(sessionId);
	}

	function closeSession() {
		activeSessionId = '';
		sessionDetail = null;
		sessionMeta = null;
		error = '';
	}

	function retry() {
		error = '';
		if (activeSessionId) loadSessionDetail(activeSessionId);
		else if (activeUser) loadSessions(activeUser.id);
		else loadUsers();
	}

	// Selection
	function toggleId<T>(ids: T[], id: T): T[] {
		return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
	}

	function pruneSessionSelection() {
		const visible = new Set(selectableSessions.map((s) => s.id));
		selectedSessionIds = selectedSessionIds.filter((id) => visible.has(id));
	}

	function toggleTaskFilter(task: string) {
		hiddenTasks = toggleId(hiddenTasks, task);
		pruneSessionSelection();
	}

	function toggleModeFilter(mode: SessionMode) {
		hiddenModes = toggleId(hiddenModes, mode);
		pruneSessionSelection();
	}

	function toggleStatusFilter(status: string) {
		hiddenStatuses = toggleId(hiddenStatuses, status);
		pruneSessionSelection();
	}

	function toggleAllUsers() {
		selectedUserIds = allUsersSelected ? [] : selectableUsers.map((u) => u.id);
	}

	function toggleAllSessions() {
		selectedSessionIds = allSessionsSelected ? [] : selectableSessions.map((s) => s.id);
	}

	function toggleDaySessions(daySelectableIds: string[], dayAllSelected: boolean) {
		if (dayAllSelected) {
			selectedSessionIds = selectedSessionIds.filter((id) => !daySelectableIds.includes(id));
		} else {
			selectedSessionIds = [...new Set([...selectedSessionIds, ...daySelectableIds])];
		}
	}

	function toggleRole(role: UserRole) {
		selectedRoles = selectedRoles.includes(role)
			? selectedRoles.filter((r) => r !== role)
			: [...selectedRoles, role];
		const allowed = new Set(users.filter((u) => selectedRoles.includes(u.role)).map((u) => u.id));
		selectedUserIds = selectedUserIds.filter((id) => allowed.has(id));
	}

	function cancelUserSelection() {
		userSelectMode = false;
		selectedUserIds = [];
	}

	function cancelSessionSelection() {
		sessionSelectMode = false;
		selectedSessionIds = [];
	}

	// Export
	function dateStamp(): string {
		return new Date().toISOString().slice(0, 10);
	}

	async function exportSelectedUsers() {
		if (selectedUserIds.length === 0 || isExporting) return;
		isExporting = true;
		error = '';
		try {
			const userIds = [...selectedUserIds];
			const prepared = await prepareSessionExport({
				userIds,
				fileName: `develex_export_${dateStamp()}.zip`
			});
			triggerUrlDownload(getExportDownloadUrl(prepared.token));
			cancelUserSelection();
			const n = userIds.length;
			showSuccess(
				`Export zahájen (${n} ${n === 1 ? 'uživatel' : n < 5 ? 'uživatelé' : 'uživatelů'})`
			);
		} catch {
			error = 'Nepodařilo se exportovat vybraná data';
		} finally {
			isExporting = false;
		}
	}

	async function exportSelectedSessions() {
		if (selectedSessionIds.length === 0 || isExporting || !activeUser) return;
		isExporting = true;
		error = '';
		try {
			const sessionIds = [...selectedSessionIds];
			const prepared = await prepareSessionExport({
				sessionIds,
				fileName: `${activeUser.username}_export_${dateStamp()}.zip`
			});
			triggerUrlDownload(getExportDownloadUrl(prepared.token));
			cancelSessionSelection();
			showSuccess(`Export zahájen (${sessionIds.length} sezení)`);
		} catch {
			error = 'Nepodařilo se exportovat vybraná sezení';
		} finally {
			isExporting = false;
		}
	}

	async function downloadDetailZip() {
		if (!activeSessionId || !sessionDetail || !activeUser) return;
		isDownloading = true;
		error = '';
		try {
			const sessionStart = sessionDetail.sessionStartTime
				? new Date(sessionDetail.sessionStartTime).toISOString().replace(/[:.]/g, '-').slice(0, 19)
				: 'unknown';
			const zipName = `${activeUser.username}_${sessionDetail.testType}_${sessionStart}.zip`;
			const prepared = await prepareSessionExport({
				sessionIds: [activeSessionId],
				fileName: zipName
			});
			triggerUrlDownload(getExportDownloadUrl(prepared.token));
			showSuccess('Stahování zahájeno');
		} catch {
			error = 'Nepodařilo se stáhnout ZIP archiv';
		} finally {
			isDownloading = false;
		}
	}

	async function downloadSingleFile(fileId: string, fileName: string) {
		if (!activeSessionId) return;
		try {
			const blob = await downloadTestSessionFile(activeSessionId, fileId);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se stáhnout soubor';
		}
	}

	function openRecalcDialog(scope: RecalculationScope) {
		recalcScope = scope;
		recalcDialogOpen = true;
	}

	function handleRecalcFinished() {
		showSuccess('Doplnění souborů dokončeno');
		if (activeSessionId) loadSessionDetail(activeSessionId);
		else if (activeUser) loadSessions(activeUser.id);
	}

	async function handleDeleteSession() {
		if (!activeSessionId) return;
		isDeleting = true;
		dialogError = '';
		try {
			const deletedId = activeSessionId;
			await deleteTestSession(deletedId);
			deleteDialogOpen = false;
			closeSession();
			sessions = sessions.filter((s) => s.id !== deletedId);
			selectedSessionIds = selectedSessionIds.filter((id) => id !== deletedId);
			if (activeUser) {
				sessionCounts = {
					...sessionCounts,
					[activeUser.id]: Math.max(0, (sessionCounts[activeUser.id] ?? 1) - 1)
				};
			}
		} catch (err) {
			dialogError = err instanceof Error ? err.message : 'Nepodařilo se smazat sezení';
		} finally {
			isDeleting = false;
		}
	}

	// Formatting
	function getRoleColor(role: UserRole): string {
		switch (role) {
			case UserRole.Admin:
				return 'bg-purple-100 text-purple-800';
			case UserRole.Supervisor:
				return 'bg-blue-100 text-blue-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function formatShortDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('cs-CZ', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

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

	function formatDuration(ms: number | null): string {
		if (ms === null || ms <= 0) return '—';
		const totalSeconds = Math.round(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return minutes > 0 ? `${minutes} min ${seconds} s` : `${seconds} s`;
	}

	/**
	 * The measured rate is the only one real hardware has — no tracker reports a
	 * nominal rate through the bridge, so only the dummy input declares one.
	 */
	function formatFrequency(meta: SessionMeta): string {
		const measured = meta.tracker.signal.measuredFrequencyHz;
		if (measured !== null) {
			const nominal = snapToCommonRate(measured);
			return nominal === measured ? `${nominal} Hz` : `${nominal} Hz (naměřeno ${measured})`;
		}
		const config = meta.tracker.config;
		return config && 'frequency' in config ? `${config.frequency} Hz (nastaveno)` : '—';
	}

	function formatValidSamples(signal: SessionMeta['tracker']['signal']): string {
		if (signal.sampleCount === 0) return '—';
		const percent = Math.round((signal.validSampleCount / signal.sampleCount) * 100);
		return `${percent} % z ${signal.sampleCount}`;
	}

	function browserLabel(meta: SessionMeta): string {
		const brand = meta.browser.brands?.find((b) => !/Not.?A.?Brand/i.test(b));
		const parts = [brand, meta.browser.platform].filter(Boolean);
		return parts.length > 0 ? parts.join(' · ') : meta.browser.userAgent;
	}

	function sessionDuration(meta: SessionMeta): string {
		if (!meta.session.startedAt) return '—';
		return formatDuration(Date.parse(meta.session.endedAt) - Date.parse(meta.session.startedAt));
	}

	function metaFacts(meta: SessionMeta): { label: string; value: string }[] {
		const dpr = meta.screen.devicePixelRatio;
		const config = meta.tracker.config;
		return [
			{
				label: 'Rozlišení monitoru',
				value: `${meta.screen.width} × ${meta.screen.height}${dpr !== 1 ? ` @ ${dpr}×` : ''}`
			},
			{
				label: 'Okno prohlížeče',
				value: `${meta.viewport.innerWidth} × ${meta.viewport.innerHeight}`
			},
			{
				label: 'Eyetracker',
				value: config ? `${config.tracker} · ${config.fixationDetection}` : '—'
			},
			{ label: 'Frekvence', value: formatFrequency(meta) },
			{ label: 'Platné vzorky', value: formatValidSamples(meta.tracker.signal) },
			{
				label: 'Kalibrace zařízení',
				value: meta.tracker.deviceCalibratedAt ? formatDate(meta.tracker.deviceCalibratedAt) : '—'
			},
			{ label: 'Délka sezení', value: sessionDuration(meta) },
			{ label: 'Prohlížeč', value: browserLabel(meta) },
			{ label: 'Verze aplikace', value: `${meta.app.version} · SDK ${meta.app.sdkVersion}` }
		];
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
</script>

<svelte:head>
	<title>Soubory sezení - DeveLex Tasks</title>
</svelte:head>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKey} />

<DefaultLayout>
	{#if !activeUser}
		<BackButton label="Zpět do hlavní nabídky" onclick={() => goto(resolve(`/`))} />
	{/if}

	<h1 class="text-2xl font-black text-gray-800">Soubory sezení</h1>

	<div>
		{#if error}
			<div
				class="mb-4 flex items-center justify-between gap-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
			>
				<span>{error}</span>
				<button class="shrink-0 font-semibold hover:underline" onclick={retry}>
					Zkusit znovu
				</button>
			</div>
		{/if}

		{#if !activeUser}
			<!-- Users view -->
			<div class="mb-4 flex items-center gap-2">
				<div class="relative flex-1">
					<Icon
						icon="material-symbols:search"
						class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
					/>
					<input
						type="text"
						bind:value={userSearch}
						placeholder="Hledat uživatele…"
						class="w-full rounded-md border border-gray-300 bg-white py-2 pr-3 pl-10 text-gray-800"
					/>
				</div>
				<div class="relative shrink-0" bind:this={filterMenuRef}>
					<button
						type="button"
						aria-label="Filtry"
						aria-haspopup="menu"
						aria-expanded={filterMenuOpen}
						class="relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
						onclick={() => (filterMenuOpen = !filterMenuOpen)}
					>
						<Icon icon="material-symbols:filter-alt-outline" class="h-5 w-5" />
						{#if filtersActive}
							<span class="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-500"></span>
						{/if}
					</button>
					{#if filterMenuOpen}
						<div
							class="absolute right-0 z-20 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
						>
							<p class="mb-1 text-xs font-semibold text-gray-500 uppercase">Role</p>
							{#each roleFilterOrder as role (role)}
								<label class="flex items-center gap-2 py-1 text-sm text-gray-700">
									<input
										type="checkbox"
										class="h-4 w-4 accent-blue-600"
										checked={selectedRoles.includes(role)}
										onchange={() => toggleRole(role)}
									/>
									{roleLabels[role]}
								</label>
							{/each}
							<div class="my-2 border-t border-gray-100"></div>
							<label class="flex items-center gap-2 py-1 text-sm text-gray-700">
								<input
									type="checkbox"
									class="h-4 w-4 accent-blue-600"
									checked={hideEmptyUsers}
									disabled={!countsLoaded}
									onchange={() => (hideEmptyUsers = !hideEmptyUsers)}
								/>
								Skrýt uživatele bez sezení
							</label>
						</div>
					{/if}
				</div>
				{#if userSelectMode}
					<button
						class="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 hover:bg-gray-100"
						onclick={cancelUserSelection}
					>
						Zrušit
					</button>
					<button
						class="inline-flex shrink-0 items-center gap-2 rounded-md bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
						disabled={selectedUserIds.length === 0 || isExporting}
						onclick={exportSelectedUsers}
					>
						{#if isExporting}
							<Icon icon="mdi:loading" class="h-4 w-4 animate-spin" />
							Exportuji…
						{:else}
							<Icon icon="material-symbols:download" class="h-4 w-4" />
							Exportovat vybrané{selectedUserIds.length > 0 ? ` (${selectedUserIds.length})` : ''}
						{/if}
					</button>
				{:else}
					<button
						class="inline-flex shrink-0 items-center gap-2 rounded-md bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600"
						onclick={() => (userSelectMode = true)}
					>
						<Icon icon="material-symbols:download" class="h-4 w-4" />
						Exportovat…
					</button>
				{/if}
				{#if canManageSessions}
					<div class="relative shrink-0" bind:this={globalMenuRef}>
						<button
							type="button"
							aria-label="Další akce"
							aria-haspopup="menu"
							aria-expanded={globalMenuOpen}
							class="inline-flex h-[38px] w-[38px] items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
							onclick={() => (globalMenuOpen = !globalMenuOpen)}
						>
							<Icon icon="material-symbols:more-vert" class="h-5 w-5" />
						</button>
						{#if globalMenuOpen}
							<div
								role="menu"
								class="absolute right-0 z-20 mt-1 w-64 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
							>
								<button
									type="button"
									role="menuitem"
									class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
									onclick={() => {
										globalMenuOpen = false;
										openRecalcDialog({});
									}}
								>
									<Icon icon="material-symbols:autorenew" class="h-4 w-4" />
									Doplnit chybějící soubory (vše)…
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			{#if isLoadingUsers}
				<div
					class="flex h-48 items-center justify-center rounded-xl bg-white shadow-md shadow-gray-300/50"
				>
					<p class="text-lg text-gray-500">Načítání…</p>
				</div>
			{:else if users.length === 0}
				<div
					class="flex h-48 items-center justify-center rounded-xl bg-white shadow-md shadow-gray-300/50"
				>
					<p class="text-lg text-gray-500">Žádní uživatelé</p>
				</div>
			{:else if filteredUsers.length === 0}
				<div
					class="flex h-48 items-center justify-center rounded-xl bg-white shadow-md shadow-gray-300/50"
				>
					<p class="text-lg text-gray-500">Žádní uživatelé neodpovídají hledání</p>
				</div>
			{:else}
				{#if userSelectMode}
					<div
						class="mb-3 flex items-center gap-3 rounded-xl bg-white px-5 py-2.5 shadow-md shadow-gray-300/50"
					>
						<input
							type="checkbox"
							class="h-4 w-4 accent-blue-600"
							checked={allUsersSelected}
							disabled={selectableUsers.length === 0}
							onchange={toggleAllUsers}
						/>
						<span class="text-xs font-semibold text-gray-500 uppercase">Vybrat vše</span>
						{#if selectedUserIds.length > 0}
							<span class="text-xs text-gray-400">{selectedUserIds.length} vybráno</span>
						{/if}
					</div>
				{/if}
				<div class="overflow-hidden rounded-xl bg-white shadow-md shadow-gray-300/50">
					<div class="divide-y divide-gray-100">
						{#each filteredUsers as user (user.id)}
							{@const count = countsLoaded ? (sessionCounts[user.id] ?? 0) : null}
							{@const selectable = count !== 0}
							<div class="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50">
								{#if userSelectMode}
									<input
										type="checkbox"
										class="h-4 w-4 shrink-0 accent-blue-600"
										checked={selectedUserIds.includes(user.id)}
										disabled={!selectable}
										onchange={() => (selectedUserIds = toggleId(selectedUserIds, user.id))}
									/>
								{/if}
								<button
									type="button"
									class="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-4 text-left"
									onclick={() => {
										if (userSelectMode) {
											if (selectable) selectedUserIds = toggleId(selectedUserIds, user.id);
										} else {
											openUser(user);
										}
									}}
								>
									<div class="min-w-0">
										<span class="text-sm font-medium text-gray-900">{userDisplayName(user)}</span>
										<p class="truncate text-xs text-gray-500">@{user.username}</p>
									</div>
									<div class="flex shrink-0 items-center gap-4">
										{#if user.role !== UserRole.Student}
											<span
												class="rounded-full px-2 py-0.5 text-xs font-semibold {getRoleColor(
													user.role
												)}"
											>
												{roleLabels[user.role]}
											</span>
										{/if}
										{#if count !== null}
											<span class="text-xs {count === 0 ? 'text-gray-300' : 'text-gray-400'}">
												{count} sezení
											</span>
										{/if}
										<span class="text-xs text-gray-400">
											Poslední přihlášení: {user.lastLogin
												? formatShortDate(user.lastLogin)
												: 'nikdy'}
										</span>
									</div>
								</button>
								{#if canManageSessions}
									<div class="relative shrink-0" data-row-menu>
										<button
											type="button"
											aria-label="Další akce"
											aria-haspopup="menu"
											aria-expanded={openUserMenuId === user.id}
											class="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
											onclick={() => (openUserMenuId = openUserMenuId === user.id ? '' : user.id)}
										>
											<Icon icon="material-symbols:more-vert" class="h-5 w-5" />
										</button>
										{#if openUserMenuId === user.id}
											<div
												role="menu"
												class="absolute right-0 z-20 mt-1 w-60 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
											>
												<button
													type="button"
													role="menuitem"
													class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
													onclick={() => {
														openUserMenuId = '';
														openRecalcDialog({ userIds: [user.id] });
													}}
												>
													<Icon icon="material-symbols:autorenew" class="h-4 w-4" />
													Doplnit chybějící soubory…
												</button>
											</div>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{:else if !activeSessionId}
			<!-- Sessions view -->
			<div class="mb-4">
				<button
					class="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
					onclick={closeUser}
				>
					<Icon icon="mdi:arrow-left" class="h-4 w-4" />
					Zpět na seznam
				</button>
			</div>

			<div class="mb-6 rounded-xl bg-white p-5 shadow-md shadow-gray-300/50">
				<div class="flex flex-wrap items-center justify-between gap-4">
					<div class="flex items-center gap-4">
						<div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100">
							<Icon icon="material-symbols:person-outline" class="h-6 w-6 text-violet-700" />
						</div>
						<div>
							<h2 class="text-lg font-bold text-gray-800">{userDisplayName(activeUser)}</h2>
							<p class="text-sm text-gray-500">
								@{activeUser.username}
								{#if !isLoadingSessions}
									&middot; {sessionFiltersActive
										? `${filteredSessions.length} z ${sessions.length}`
										: sessions.length} sezení
								{/if}
							</p>
						</div>
					</div>
					<div class="flex items-center gap-2">
						{#if sessions.length > 0}
							<div class="relative shrink-0" bind:this={sessionFilterMenuRef}>
								<button
									type="button"
									aria-label="Filtry"
									aria-haspopup="menu"
									aria-expanded={sessionFilterMenuOpen}
									class="relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
									onclick={() => (sessionFilterMenuOpen = !sessionFilterMenuOpen)}
								>
									<Icon icon="material-symbols:filter-alt-outline" class="h-5 w-5" />
									{#if sessionFiltersActive}
										<span class="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-500"
										></span>
									{/if}
								</button>
								{#if sessionFilterMenuOpen}
									<div
										class="absolute right-0 z-20 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
									>
										<p class="mb-1 text-xs font-semibold text-gray-500 uppercase">Úloha</p>
										<div class="max-h-44 overflow-y-auto">
											{#each availableTasks as task (task)}
												<label class="flex items-center gap-2 py-1 text-sm text-gray-700">
													<input
														type="checkbox"
														class="h-4 w-4 accent-blue-600"
														checked={!hiddenTasks.includes(task)}
														onchange={() => toggleTaskFilter(task)}
													/>
													{task}
												</label>
											{/each}
										</div>
										<div class="my-2 border-t border-gray-100"></div>
										<p class="mb-1 text-xs font-semibold text-gray-500 uppercase">Typ</p>
										{#each availableModes as filterMode (filterMode)}
											<label class="flex items-center gap-2 py-1 text-sm text-gray-700">
												<input
													type="checkbox"
													class="h-4 w-4 accent-blue-600"
													checked={!hiddenModes.includes(filterMode)}
													onchange={() => toggleModeFilter(filterMode)}
												/>
												{modeLabels[filterMode]}
											</label>
										{/each}
										<div class="my-2 border-t border-gray-100"></div>
										<p class="mb-1 text-xs font-semibold text-gray-500 uppercase">Stav</p>
										{#each availableStatuses as status (status)}
											<label class="flex items-center gap-2 py-1 text-sm text-gray-700">
												<input
													type="checkbox"
													class="h-4 w-4 accent-blue-600"
													checked={!hiddenStatuses.includes(status)}
													onchange={() => toggleStatusFilter(status)}
												/>
												{getStatusLabel(status)}
											</label>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
						{#if sessionSelectMode}
							<button
								class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 hover:bg-gray-100"
								onclick={cancelSessionSelection}
							>
								Zrušit
							</button>
							<button
								class="inline-flex items-center gap-2 rounded-md bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
								disabled={selectedSessionIds.length === 0 || isExporting}
								onclick={exportSelectedSessions}
							>
								{#if isExporting}
									<Icon icon="mdi:loading" class="h-4 w-4 animate-spin" />
									Exportuji…
								{:else}
									<Icon icon="material-symbols:download" class="h-4 w-4" />
									Exportovat vybrané{selectedSessionIds.length > 0
										? ` (${selectedSessionIds.length})`
										: ''}
								{/if}
							</button>
						{:else}
							<button
								class="inline-flex items-center gap-2 rounded-md bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
								disabled={selectableSessions.length === 0}
								onclick={() => (sessionSelectMode = true)}
							>
								<Icon icon="material-symbols:download" class="h-4 w-4" />
								Exportovat…
							</button>
						{/if}
					</div>
				</div>
			</div>

			{#if isLoadingSessions}
				<div
					class="flex h-48 items-center justify-center rounded-xl bg-white shadow-md shadow-gray-300/50"
				>
					<p class="text-lg text-gray-500">Načítání sezení…</p>
				</div>
			{:else if sessions.length === 0}
				<div
					class="flex h-48 items-center justify-center rounded-xl bg-white shadow-md shadow-gray-300/50"
				>
					<p class="text-lg text-gray-400">Uživatel nemá žádná sezení</p>
				</div>
			{:else if filteredSessions.length === 0}
				<div
					class="flex h-48 items-center justify-center rounded-xl bg-white shadow-md shadow-gray-300/50"
				>
					<p class="text-lg text-gray-400">Žádná sezení neodpovídají filtru</p>
				</div>
			{:else}
				{#if sessionSelectMode}
					<div
						class="mb-3 flex items-center gap-3 rounded-xl bg-white px-5 py-2.5 shadow-md shadow-gray-300/50"
					>
						<input
							type="checkbox"
							class="h-4 w-4 accent-blue-600"
							checked={allSessionsSelected}
							disabled={selectableSessions.length === 0}
							onchange={toggleAllSessions}
						/>
						<span class="text-xs font-semibold text-gray-500 uppercase">Vybrat vše</span>
						{#if selectedSessionIds.length > 0}
							<span class="text-xs text-gray-400">{selectedSessionIds.length} vybráno</span>
						{/if}
					</div>
				{/if}
				{#each sessionGroups as group (group.label)}
					{@const daySelectableIds = group.sessions.filter((s) => s.fileCount > 0).map((s) => s.id)}
					{@const dayAllSelected =
						daySelectableIds.length > 0 &&
						daySelectableIds.every((id) => selectedSessionIds.includes(id))}
					<div
						class="mt-5 mb-2 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase"
					>
						{#if sessionSelectMode}
							<input
								type="checkbox"
								class="h-4 w-4 accent-blue-600"
								checked={dayAllSelected}
								disabled={daySelectableIds.length === 0}
								onchange={() => toggleDaySessions(daySelectableIds, dayAllSelected)}
							/>
						{/if}
						{group.label}
					</div>
					<div class="overflow-hidden rounded-xl bg-white shadow-md shadow-gray-300/50">
						<div class="divide-y divide-gray-100">
							{#each group.sessions as session (session.id)}
								{@const mode = sessionMode(session.testType)}
								<div class="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50">
									{#if sessionSelectMode}
										<input
											type="checkbox"
											class="h-4 w-4 shrink-0 accent-blue-600"
											checked={selectedSessionIds.includes(session.id)}
											disabled={session.fileCount === 0}
											onchange={() =>
												(selectedSessionIds = toggleId(selectedSessionIds, session.id))}
										/>
									{/if}
									<button
										type="button"
										class="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 text-left"
										onclick={() => {
											if (sessionSelectMode) {
												if (session.fileCount > 0)
													selectedSessionIds = toggleId(selectedSessionIds, session.id);
											} else {
												openSession(session.id);
											}
										}}
									>
										<div class="flex min-w-0 flex-wrap items-center gap-2">
											<span class="text-sm font-medium text-gray-900">
												{taskLabel(session.testType)}
											</span>
											<span
												class="rounded-full px-2 py-0.5 text-xs font-semibold {modeColors[mode]}"
											>
												{modeLabels[mode]}
											</span>
											<span
												class="rounded-full px-2 py-0.5 text-xs font-semibold {getStatusColor(
													session.status
												)}"
											>
												{getStatusLabel(session.status)}
											</span>
										</div>
										<div class="flex shrink-0 items-center gap-4 text-xs text-gray-400">
											<span>{session.fileCount} souborů</span>
											<span>{formatTime(session.sessionStartTime)}</span>
										</div>
									</button>
									{#if canManageSessions}
										<div class="relative shrink-0" data-row-menu>
											<button
												type="button"
												aria-label="Další akce"
												aria-haspopup="menu"
												aria-expanded={openSessionMenuId === session.id}
												class="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
												onclick={() =>
													(openSessionMenuId = openSessionMenuId === session.id ? '' : session.id)}
											>
												<Icon icon="material-symbols:more-vert" class="h-5 w-5" />
											</button>
											{#if openSessionMenuId === session.id}
												<div
													role="menu"
													class="absolute right-0 z-20 mt-1 w-60 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
												>
													<button
														type="button"
														role="menuitem"
														class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
														onclick={() => {
															openSessionMenuId = '';
															openRecalcDialog({ sessionIds: [session.id] });
														}}
													>
														<Icon icon="material-symbols:autorenew" class="h-4 w-4" />
														Doplnit chybějící soubory…
													</button>
												</div>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/each}
			{/if}
		{:else}
			<!-- Session detail view -->
			<div class="mb-4">
				<button
					class="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
					onclick={closeSession}
				>
					<Icon icon="mdi:arrow-left" class="h-4 w-4" />
					Zpět na sezení
				</button>
			</div>

			{#if isLoadingDetail}
				<div
					class="flex h-48 items-center justify-center rounded-xl bg-white shadow-md shadow-gray-300/50"
				>
					<p class="text-lg text-gray-500">Načítání souborů…</p>
				</div>
			{:else if sessionDetail}
				{@const allFiles = getAllFiles()}
				{@const mode = sessionMode(sessionDetail.testType)}

				<!-- Session summary card -->
				<div class="mb-6 rounded-xl bg-white p-5 shadow-md shadow-gray-300/50">
					<div class="flex flex-wrap items-center justify-between gap-4">
						<div class="flex items-center gap-4">
							<div
								class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100"
							>
								<Icon icon="material-symbols:lab-profile-outline" class="h-6 w-6 text-violet-700" />
							</div>
							<div>
								<h2 class="text-lg font-bold text-gray-800">{taskLabel(sessionDetail.testType)}</h2>
								<p class="text-sm text-gray-500">
									{sessionDetail.userFullName} &middot; {formatDate(sessionDetail.sessionStartTime)}
								</p>
							</div>
							<span class="rounded-full px-3 py-1 text-xs font-semibold {modeColors[mode]}">
								{modeLabels[mode]}
							</span>
							<span
								class="rounded-full px-3 py-1 text-xs font-semibold {getStatusColor(
									sessionDetail.status
								)}"
							>
								{getStatusLabel(sessionDetail.status)}
							</span>
						</div>
						<div class="flex items-center gap-2">
							<button
								class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
								disabled={isDownloading || allFiles.length === 0}
								onclick={downloadDetailZip}
							>
								{#if isDownloading}
									<Icon icon="mdi:loading" class="h-5 w-5 animate-spin" />
									Stahuji…
								{:else}
									<Icon icon="material-symbols:download" class="h-5 w-5" />
									Stáhnout vše jako ZIP
								{/if}
							</button>
							{#if canManageSessions}
								<div class="relative" bind:this={menuRef}>
									<button
										type="button"
										aria-label="Další akce"
										aria-haspopup="menu"
										aria-expanded={menuOpen}
										class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
										disabled={isDeleting}
										onclick={() => (menuOpen = !menuOpen)}
									>
										<Icon icon="material-symbols:more-vert" class="h-5 w-5" />
									</button>
									{#if menuOpen}
										<div
											role="menu"
											class="absolute right-0 z-20 mt-1 w-60 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
										>
											<button
												type="button"
												role="menuitem"
												class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
												onclick={() => {
													menuOpen = false;
													openRecalcDialog({ sessionIds: [activeSessionId] });
												}}
											>
												<Icon icon="material-symbols:autorenew" class="h-4 w-4" />
												Doplnit chybějící soubory…
											</button>
											<button
												type="button"
												role="menuitem"
												class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
												onclick={() => {
													menuOpen = false;
													dialogError = '';
													deleteDialogOpen = true;
												}}
											>
												<Icon icon="material-symbols:delete-outline" class="h-4 w-4" />
												Smazat sezení
											</button>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					</div>
					<div
						class="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-gray-100 pt-3 text-sm text-gray-500"
					>
						<span>
							<Icon
								icon="material-symbols:layers-outline"
								class="mr-1 inline h-4 w-4 align-text-bottom"
							/>
							{sessionDetail.partCount}
							{sessionDetail.partCount === 1 ? 'část' : 'částí'}
						</span>
						<span>
							<Icon
								icon="material-symbols:attach-file"
								class="mr-1 inline h-4 w-4 align-text-bottom"
							/>
							{allFiles.length}
							{allFiles.length === 1 ? 'soubor' : 'souborů'}
						</span>
						{#if sessionDetail.sessionEndTime}
							<span>
								<Icon
									icon="material-symbols:timer-outline"
									class="mr-1 inline h-4 w-4 align-text-bottom"
								/>
								Ukončeno: {formatDate(sessionDetail.sessionEndTime)}
							</span>
						{/if}
					</div>
				</div>

				{#if metaPart}
					<!-- Meta part: full-width row above the slide parts -->
					<div class="mb-6 rounded-xl bg-white shadow-md shadow-gray-300/50">
						<div class="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
							<div class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
								<Icon icon="material-symbols:database-outline" class="h-5 w-5 text-slate-600" />
							</div>
							<div class="min-w-0 flex-1">
								<span class="text-sm font-semibold text-gray-800">Metadata sezení</span>
								<span class="ml-1 text-xs text-gray-400">prostředí, tracker a logy</span>
								{#if sessionMeta?.recalculated}
									<span
										class="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700"
										title="Rekonstruováno {formatDate(
											sessionMeta.recalculated.at
										)} ({sessionMeta.recalculated.items.join(
											', '
										)}) – nemusí odpovídat skutečnému prostředí záznamu"
									>
										Rekonstruováno
									</span>
								{/if}
							</div>
							<span class="shrink-0 text-xs text-gray-400">
								{(metaPart.files ?? []).length} souborů
							</span>
						</div>

						{#if sessionMeta}
							<dl
								class="grid grid-cols-2 gap-x-6 gap-y-3 border-b border-gray-100 px-4 py-4 sm:grid-cols-3 lg:grid-cols-5"
							>
								{#each metaFacts(sessionMeta) as fact (fact.label)}
									<div class="min-w-0">
										<dt class="text-xs text-gray-400">{fact.label}</dt>
										<dd class="truncate text-sm font-medium text-gray-800" title={fact.value}>
											{fact.value}
										</dd>
									</div>
								{/each}
							</dl>
						{/if}

						{#if (metaPart.files ?? []).length === 0}
							<div class="px-4 py-6 text-center text-sm text-gray-400">Žádné soubory</div>
						{:else}
							<div class="grid gap-1 p-2 sm:grid-cols-2 lg:grid-cols-3">
								{#each metaPart.files as file (file.id)}
									<div
										class="group flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-gray-50"
									>
										<div
											class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600"
										>
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
				{/if}

				{#if allFiles.length === 0}
					<div
						class="flex h-48 items-center justify-center rounded-xl bg-white shadow-md shadow-gray-300/50"
					>
						<p class="text-lg text-gray-400">Toto sezení nemá žádné soubory</p>
					</div>
				{:else if slideParts.length > 0}
					<!-- Parts side by side with wrapping, files stacked vertically -->
					<div class="flex flex-wrap gap-5">
						{#each slideParts as part (part.id)}
							<div class="flex w-80 flex-col rounded-xl bg-white shadow-md shadow-gray-300/50">
								<!-- Part header -->
								<div class="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
									<div
										class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100"
									>
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
									<div class="px-4 py-6 text-center text-sm text-gray-400">Žádné soubory</div>
								{:else}
									<div class="flex flex-col divide-y divide-gray-50 p-2">
										{#each part.files as file (file.id)}
											<div
												class="group flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-gray-50"
											>
												<div
													class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600"
												>
													<Icon icon={getFileIcon(file.fileType)} class="h-5 w-5" />
												</div>
												<div class="min-w-0 flex-1">
													<p
														class="truncate text-sm font-medium text-gray-800"
														title={file.fileName}
													>
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
		{/if}
	</div>
</DefaultLayout>

<!-- Success toast -->
{#if successMessage}
	<div
		class="fixed bottom-6 left-1/2 z-30 -translate-x-1/2"
		transition:fly={{ y: 8, duration: 150 }}
	>
		<div
			class="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg"
		>
			<Icon icon="material-symbols:check-circle-outline" class="h-5 w-5" />
			{successMessage}
		</div>
	</div>
{/if}

<!-- Recalculation dialog -->
<RecalculateDialog
	bind:open={recalcDialogOpen}
	scope={recalcScope}
	onFinished={handleRecalcFinished}
/>

<!-- Delete confirmation dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>Smazat sezení</Dialog.Title>
			<Dialog.Description>
				Tato akce je nevratná. Sezení a všechny jeho soubory budou trvale odstraněny.
			</Dialog.Description>
		</Dialog.Header>

		{#if sessionDetail}
			<div class="space-y-4 py-4">
				<div class="rounded-lg border border-red-200 bg-red-50 p-4">
					<p class="mb-2 text-sm font-medium text-red-800">Chystáte se smazat:</p>
					<div class="space-y-1 text-sm text-red-700">
						<p><span class="font-semibold">Uživatel:</span> {sessionDetail.userFullName}</p>
						<p><span class="font-semibold">Typ testu:</span> {sessionDetail.testType}</p>
						<p>
							<span class="font-semibold">Začátek:</span>
							{formatDate(sessionDetail.sessionStartTime)}
						</p>
						<p><span class="font-semibold">Počet souborů:</span> {getAllFiles().length}</p>
					</div>
				</div>

				{#if dialogError}
					<div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
						{dialogError}
					</div>
				{/if}
			</div>

			<Dialog.Footer>
				<button
					type="button"
					class="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 disabled:opacity-50"
					onclick={() => (deleteDialogOpen = false)}
					disabled={isDeleting}
				>
					Zrušit
				</button>
				<button
					type="button"
					class="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
					onclick={handleDeleteSession}
					disabled={isDeleting}
				>
					{isDeleting ? 'Mazání...' : 'Smazat sezení'}
				</button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
