<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { getAllUsers } from '$lib/api/user-management';
	import { getMyGroupMembers } from '$lib/api/groups';
	import { getSessionCountsPerUser, getTestSessions } from '$lib/api/test-sessions';
	import { hasCapability } from '$lib/utils/capabilityGuard';
	import { authUser } from '$lib/stores/auth';
	import { SortBy, SortDirection, type TestSessionDTO, type UserDTO } from '$lib/types/api.types';
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
		userDisplayName
	} from '$lib/utils/sessionLabels';

	interface Props {
		/** Sessions picked so far; may span several users. */
		selected: TestSessionDTO[];
		multiSelect?: boolean;
	}

	let { selected = $bindable([]), multiSelect = true }: Props = $props();

	let users = $state<UserDTO[]>([]);
	let counts = $state<Record<string, number>>({});
	let countsLoaded = $state(false);
	let userSearch = $state('');
	let activeUser = $state<UserDTO | null>(null);
	let sessionsByUser = $state<Record<string, TestSessionDTO[]>>({});
	let isLoadingUsers = $state(false);
	let isLoadingSessions = $state(false);
	let error = $state('');

	const filteredUsers = $derived.by(() => {
		const query = userSearch.trim().toLowerCase();
		return users.filter(
			(user) =>
				(!countsLoaded || (counts[user.id] ?? 0) > 0) &&
				(!query ||
					userDisplayName(user).toLowerCase().includes(query) ||
					user.username.toLowerCase().includes(query))
		);
	});

	const sessions = $derived(activeUser ? (sessionsByUser[activeUser.id] ?? []) : []);
	const selectableSessions = $derived(sessions.filter((session) => session.fileCount > 0));
	const selectedIds = $derived(new Set(selected.map((session) => session.id)));
	const allVisibleSelected = $derived(
		selectableSessions.length > 0 &&
			selectableSessions.every((session) => selectedIds.has(session.id))
	);

	const dayGroups = $derived.by(() => {
		const groups: { label: string; sessions: TestSessionDTO[] }[] = [];
		for (const session of sessions) {
			const label = formatDayHeading(session.sessionStartTime);
			const last = groups[groups.length - 1];
			if (last && last.label === label) last.sessions.push(session);
			else groups.push({ label, sessions: [session] });
		}
		return groups;
	});

	onMount(() => {
		void loadUsers();
		void loadCounts();
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
			counts = await getSessionCountsPerUser();
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
			for (let page = 0; ; page++) {
				const result = await getTestSessions(
					page,
					-1,
					SortBy.SessionStartTime,
					SortDirection.Desc,
					userId
				);
				all.push(...result.content);
				if (result.last || result.content.length === 0) break;
			}
			sessionsByUser = { ...sessionsByUser, [userId]: all };
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se načíst sezení';
		} finally {
			isLoadingSessions = false;
		}
	}

	function openUser(user: UserDTO) {
		activeUser = user;
		if (!sessionsByUser[user.id]) void loadSessions(user.id);
	}

	function toggleSession(session: TestSessionDTO) {
		if (session.fileCount === 0) return;
		if (!multiSelect) {
			selected = [session];
			return;
		}
		selected = selectedIds.has(session.id)
			? selected.filter((item) => item.id !== session.id)
			: [...selected, session];
	}

	function toggleAllVisible() {
		if (allVisibleSelected) {
			const visible = new Set(selectableSessions.map((session) => session.id));
			selected = selected.filter((session) => !visible.has(session.id));
		} else {
			const missing = selectableSessions.filter((session) => !selectedIds.has(session.id));
			selected = [...selected, ...missing];
		}
	}

	function removeSelected(sessionId: string) {
		selected = selected.filter((session) => session.id !== sessionId);
	}

	const inputClass =
		'w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800';
</script>

<div class="flex h-[60vh] min-h-0 gap-3">
	<aside class="flex w-64 shrink-0 flex-col overflow-hidden rounded-md border border-gray-200">
		<div class="border-b border-gray-200 p-2">
			<input
				type="search"
				class={inputClass}
				placeholder="Hledat uživatele…"
				bind:value={userSearch}
			/>
		</div>
		<ul class="min-h-0 flex-1 overflow-y-auto">
			{#if isLoadingUsers}
				<li class="px-3 py-4 text-center text-sm text-gray-400">Načítám…</li>
			{:else if filteredUsers.length === 0}
				<li class="px-3 py-4 text-center text-sm text-gray-400">Žádný uživatel</li>
			{/if}
			{#each filteredUsers as user (user.id)}
				{@const name = userDisplayName(user)}
				<li>
					<button
						type="button"
						class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 {activeUser?.id ===
						user.id
							? 'bg-blue-50 text-blue-700'
							: 'text-gray-800'}"
						onclick={() => openUser(user)}
					>
						<span class="min-w-0">
							<span class="block truncate font-medium">{name}</span>
							{#if name !== user.username}
								<span class="block truncate text-xs text-gray-400">{user.username}</span>
							{/if}
						</span>
						{#if countsLoaded}
							<span class="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
								{counts[user.id] ?? 0}
							</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	</aside>

	<section class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-gray-200">
		{#if !activeUser}
			<p class="flex flex-1 items-center justify-center px-4 text-center text-sm text-gray-400">
				Vyberte uživatele vlevo.
			</p>
		{:else}
			<div class="flex items-center gap-2 border-b border-gray-200 px-3 py-2 text-sm">
				{#if multiSelect}
					<input
						type="checkbox"
						class="h-4 w-4 accent-blue-600"
						checked={allVisibleSelected}
						disabled={selectableSessions.length === 0}
						onchange={toggleAllVisible}
						aria-label="Vybrat všechna sezení uživatele"
					/>
				{/if}
				<span class="font-medium text-gray-800">{userDisplayName(activeUser)}</span>
				<span class="text-xs text-gray-400">
					{isLoadingSessions ? 'načítám…' : `${sessions.length} sezení`}
				</span>
			</div>
			<div class="min-h-0 flex-1 overflow-y-auto">
				{#if !isLoadingSessions && sessions.length === 0}
					<p class="px-3 py-4 text-center text-sm text-gray-400">Uživatel nemá žádná sezení.</p>
				{/if}
				{#each dayGroups as group (group.label)}
					<div
						class="sticky top-0 border-b border-gray-100 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-500 uppercase"
					>
						{group.label}
					</div>
					{#each group.sessions as session (session.id)}
						{@const mode = sessionMode(session.testType)}
						{@const picked = selectedIds.has(session.id)}
						<button
							type="button"
							class="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-2 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 {picked
								? 'bg-blue-50/60'
								: ''}"
							disabled={session.fileCount === 0}
							onclick={() => toggleSession(session)}
						>
							<Icon
								icon={picked
									? multiSelect
										? 'material-symbols:check-box'
										: 'material-symbols:radio-button-checked'
									: multiSelect
										? 'material-symbols:check-box-outline-blank'
										: 'material-symbols:radio-button-unchecked'}
								class="h-5 w-5 shrink-0 {picked ? 'text-blue-600' : 'text-gray-400'}"
							/>
							<span class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
								<span class="text-sm font-medium text-gray-900">{taskLabel(session.testType)}</span>
								<span class="rounded-full px-2 py-0.5 text-xs font-semibold {modeColors[mode]}">
									{modeLabels[mode]}
								</span>
								<span
									class="rounded-full px-2 py-0.5 text-xs font-semibold {getStatusColor(
										session.status
									)}"
								>
									{getStatusLabel(session.status)}
								</span>
							</span>
							<span class="shrink-0 text-xs text-gray-400">
								{session.fileCount} souborů · {formatTime(session.sessionStartTime)}
							</span>
						</button>
					{/each}
				{/each}
			</div>
		{/if}
	</section>
</div>

{#if error}
	<div class="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
{/if}

{#if multiSelect && selected.length > 0}
	<div class="mt-3 flex max-h-24 flex-wrap items-center gap-1.5 overflow-y-auto">
		{#each selected as session (session.id)}
			<span
				class="inline-flex items-center gap-1 rounded-full bg-blue-50 py-0.5 pr-1 pl-2.5 text-xs text-blue-700"
			>
				{session.username} · {taskLabel(session.testType)} · {formatDate(session.sessionStartTime)}
				<button
					type="button"
					class="rounded-full p-0.5 hover:bg-blue-100"
					aria-label="Odebrat"
					onclick={() => removeSelected(session.id)}
				>
					<Icon icon="material-symbols:close" class="h-3.5 w-3.5" />
				</button>
			</span>
		{/each}
		<button
			type="button"
			class="ml-1 text-xs text-gray-500 hover:underline"
			onclick={() => (selected = [])}
		>
			Vymazat výběr
		</button>
	</div>
{/if}
