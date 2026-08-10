<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import {
		getAllUsers,
		activateUser,
		deactivateUser,
		lockUser,
		unlockUser
	} from '$lib/api/user-management';
	import { UserRole, UserStatus, roleLabels, type UserDTO } from '$lib/types/api.types';
	import { hasCapability } from '$lib/utils/capabilityGuard';
	import { authUser } from '$lib/stores/auth';
	import CreateUserDialog from './CreateUserDialog.svelte';
	import BulkCreateDialog from './BulkCreateDialog.svelte';
	import EditUserDialog from './EditUserDialog.svelte';
	import ChangeRoleDialog from './ChangeRoleDialog.svelte';
	import CapabilitiesDialog from './CapabilitiesDialog.svelte';
	import DeleteUserDialog from './DeleteUserDialog.svelte';
	import SessionsDialog from './SessionsDialog.svelte';

	let users = $state<UserDTO[]>([]);
	let selectedUserId = $state('');
	let searchQuery = $state('');
	let isLoading = $state(true);
	let error = $state('');

	let pageMenuOpen = $state(false);
	let pageMenuRef = $state<HTMLDivElement | null>(null);
	let detailMenuOpen = $state(false);
	let detailMenuRef = $state<HTMLDivElement | null>(null);

	let createUserOpen = $state(false);
	let bulkCreateOpen = $state(false);
	let editUserOpen = $state(false);
	let changeRoleOpen = $state(false);
	let capabilitiesOpen = $state(false);
	let deleteUserOpen = $state(false);
	let sessionsOpen = $state(false);

	let canManageUsers = $derived(hasCapability($authUser, 'USER_MANAGE_ALL'));
	let selectedUser = $derived(users.find((u) => u.id === selectedUserId) ?? null);

	let filteredUsers = $derived.by(() => {
		const query = searchQuery.toLowerCase();
		return users.filter(
			(u) =>
				!query ||
				u.username.toLowerCase().includes(query) ||
				(u.email ?? '').toLowerCase().includes(query) ||
				(u.firstName ?? '').toLowerCase().includes(query) ||
				(u.lastName ?? '').toLowerCase().includes(query) ||
				roleLabels[u.role].toLowerCase().includes(query)
		);
	});

	function handleWindowClick(event: MouseEvent) {
		if (pageMenuOpen && pageMenuRef && !pageMenuRef.contains(event.target as Node)) {
			pageMenuOpen = false;
		}
		if (detailMenuOpen && detailMenuRef && !detailMenuRef.contains(event.target as Node)) {
			detailMenuOpen = false;
		}
	}

	function handleWindowKey(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			pageMenuOpen = false;
			detailMenuOpen = false;
		}
	}

	onMount(() => {
		loadUsers();
	});

	async function loadUsers() {
		isLoading = true;
		error = '';
		try {
			const raw = await getAllUsers();
			users = raw.slice().sort((a, b) => a.username.localeCompare(b.username, 'cs'));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se načíst uživatele';
		} finally {
			isLoading = false;
		}
	}

	async function handleStatusAction() {
		if (!selectedUser) return;
		try {
			switch (selectedUser.status) {
				case UserStatus.Unactive:
					await activateUser(selectedUser.id);
					break;
				case UserStatus.Active:
					await deactivateUser(selectedUser.id);
					break;
				case UserStatus.Locked:
					await unlockUser(selectedUser.id);
					break;
			}
			await loadUsers();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Akce se nezdařila';
		}
	}

	async function handleLockUser() {
		if (!selectedUser) return;
		try {
			await lockUser(selectedUser.id);
			await loadUsers();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se zamknout uživatele';
		}
	}

	function getStatusLabel(status: UserStatus): string {
		switch (status) {
			case UserStatus.Active:
				return 'Aktivní';
			case UserStatus.Unactive:
				return 'Neaktivní';
			case UserStatus.Locked:
				return 'Zamčený';
			default:
				return status;
		}
	}

	function getStatusColor(status: UserStatus): string {
		switch (status) {
			case UserStatus.Active:
				return 'bg-green-100 text-green-800';
			case UserStatus.Unactive:
				return 'bg-gray-100 text-gray-800';
			case UserStatus.Locked:
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusActionLabel(status: UserStatus): string {
		switch (status) {
			case UserStatus.Active:
				return 'Deaktivovat';
			case UserStatus.Unactive:
				return 'Aktivovat';
			case UserStatus.Locked:
				return 'Odemknout';
			default:
				return 'Změnit stav';
		}
	}

	function getRoleColor(role: UserRole): string {
		switch (role) {
			case UserRole.Admin:
				return 'bg-purple-100 text-purple-800';
			case UserRole.GroupAdmin:
				return 'bg-blue-100 text-blue-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function displayName(user: UserDTO): string {
		return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
	}

	function formatDate(date: Date | null | undefined): string {
		if (!date) return 'Nikdy';
		return new Date(date).toLocaleString('cs-CZ', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function exportUsersToCsv() {
		if (users.length === 0) {
			error = 'Žádní uživatelé k exportu';
			return;
		}

		const headers = ['UUID', 'Username', 'Email', 'Jméno', 'Příjmení', 'Role', 'Status'];
		const rows = users.map((u) => [
			u.id,
			u.username,
			u.email ?? '',
			u.firstName ?? '',
			u.lastName ?? '',
			u.role,
			u.status
		]);

		const csvContent = [
			headers.join(','),
			...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKey} />

{#if !selectedUser}
	<div class="mb-4 flex items-center gap-2">
		<div class="relative flex-1">
			<Icon
				icon="material-symbols:search"
				class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
			/>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Hledat uživatele…"
				class="w-full rounded-md border border-gray-300 bg-white py-2 pr-3 pl-10 text-gray-800"
			/>
		</div>
		{#if canManageUsers}
			<button
				class="shrink-0 rounded-md bg-green-500 px-3 py-2 text-sm text-gray-50 hover:bg-green-600"
				onclick={() => (createUserOpen = true)}
			>
				+ Nový uživatel
			</button>
			<div class="relative shrink-0" bind:this={pageMenuRef}>
				<button
					type="button"
					aria-label="Další akce"
					aria-haspopup="menu"
					aria-expanded={pageMenuOpen}
					class="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
					onclick={() => (pageMenuOpen = !pageMenuOpen)}
				>
					<Icon icon="material-symbols:more-vert" class="h-5 w-5" />
				</button>
				{#if pageMenuOpen}
					<div
						role="menu"
						class="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
					>
						<button
							type="button"
							role="menuitem"
							class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
							onclick={() => {
								pageMenuOpen = false;
								bulkCreateOpen = true;
							}}
						>
							<Icon icon="material-symbols:group-add-outline" class="h-4 w-4" />
							Hromadné vytvoření
						</button>
						<button
							type="button"
							role="menuitem"
							class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
							onclick={() => {
								pageMenuOpen = false;
								exportUsersToCsv();
							}}
						>
							<Icon icon="material-symbols:download" class="h-4 w-4" />
							Exportovat CSV
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	{#if isLoading}
		<div class="flex h-48 items-center justify-center rounded-xl bg-white shadow-md shadow-gray-300/50">
			<p class="text-lg text-gray-500">Načítání…</p>
		</div>
	{:else if error}
		<div class="flex h-48 flex-col items-center justify-center gap-4 rounded-xl bg-white shadow-md shadow-gray-300/50">
			<p class="text-lg text-red-500">{error}</p>
			<button
				class="rounded-md bg-blue-500 px-3 py-1.5 text-white hover:bg-blue-600"
				onclick={loadUsers}
			>
				Zkusit znovu
			</button>
		</div>
	{:else if filteredUsers.length === 0}
		<div class="flex h-48 items-center justify-center rounded-xl bg-white shadow-md shadow-gray-300/50">
			<p class="text-lg text-gray-500">Žádní uživatelé</p>
		</div>
	{:else}
		<div class="divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-md shadow-gray-300/50">
			{#each filteredUsers as user (user.id)}
				<button
					type="button"
					class="flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition-colors hover:bg-gray-50"
					onclick={() => (selectedUserId = user.id)}
				>
					<span class="text-sm font-medium text-gray-900">@{user.username}</span>
					<span
						class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {getRoleColor(user.role)}"
					>
						{roleLabels[user.role]}
					</span>
				</button>
			{/each}
		</div>
		<p class="mt-3 text-right text-sm text-gray-500">Celkem uživatelů: {filteredUsers.length}</p>
	{/if}
{:else}
	<div class="mb-4">
		<button
			class="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
			onclick={() => (selectedUserId = '')}
		>
			<Icon icon="mdi:arrow-left" class="h-4 w-4" />
			Zpět na seznam
		</button>
	</div>

	<div class="rounded-xl bg-white p-5 shadow-md shadow-gray-300/50">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="flex items-center gap-4">
				<div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100">
					<Icon icon="material-symbols:person" class="h-6 w-6 text-teal-700" />
				</div>
				<div>
					<h2 class="text-lg font-bold text-gray-800">@{selectedUser.username}</h2>
					{#if displayName(selectedUser)}
						<p class="text-sm text-gray-500">{displayName(selectedUser)}</p>
					{/if}
				</div>
				<span
					class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {getRoleColor(selectedUser.role)}"
				>
					{roleLabels[selectedUser.role]}
				</span>
				<span
					class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {getStatusColor(selectedUser.status)}"
				>
					{getStatusLabel(selectedUser.status)}
				</span>
			</div>

			{#if canManageUsers}
				<div class="relative" bind:this={detailMenuRef}>
					<button
						type="button"
						aria-label="Akce uživatele"
						aria-haspopup="menu"
						aria-expanded={detailMenuOpen}
						class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
						onclick={() => (detailMenuOpen = !detailMenuOpen)}
					>
						<Icon icon="material-symbols:more-vert" class="h-5 w-5" />
					</button>
					{#if detailMenuOpen}
						<div
							role="menu"
							class="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
						>
							<button
								type="button"
								role="menuitem"
								class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
								onclick={() => {
									detailMenuOpen = false;
									editUserOpen = true;
								}}
							>
								<Icon icon="material-symbols:edit-outline" class="h-4 w-4" />
								Upravit
							</button>
							<button
								type="button"
								role="menuitem"
								class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
								onclick={() => {
									detailMenuOpen = false;
									changeRoleOpen = true;
								}}
							>
								<Icon icon="material-symbols:badge-outline" class="h-4 w-4" />
								Změnit roli
							</button>
							<button
								type="button"
								role="menuitem"
								class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
								onclick={() => {
									detailMenuOpen = false;
									capabilitiesOpen = true;
								}}
							>
								<Icon icon="material-symbols:key-outline" class="h-4 w-4" />
								Oprávnění
							</button>
							<button
								type="button"
								role="menuitem"
								class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
								onclick={() => {
									detailMenuOpen = false;
									sessionsOpen = true;
								}}
							>
								<Icon icon="material-symbols:devices-outline" class="h-4 w-4" />
								Relace
							</button>
							<button
								type="button"
								role="menuitem"
								class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
								onclick={() => {
									detailMenuOpen = false;
									handleStatusAction();
								}}
							>
								<Icon icon="material-symbols:power-settings-new" class="h-4 w-4" />
								{getStatusActionLabel(selectedUser.status)}
							</button>
							{#if selectedUser.status === UserStatus.Active}
								<button
									type="button"
									role="menuitem"
									class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
									onclick={() => {
										detailMenuOpen = false;
										handleLockUser();
									}}
								>
									<Icon icon="material-symbols:lock-outline" class="h-4 w-4" />
									Zamknout
								</button>
							{/if}
							<button
								type="button"
								role="menuitem"
								class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
								onclick={() => {
									detailMenuOpen = false;
									deleteUserOpen = true;
								}}
							>
								<Icon icon="material-symbols:delete-outline" class="h-4 w-4" />
								Smazat
							</button>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<div class="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-sm sm:grid-cols-2">
			<div class="flex justify-between gap-4">
				<span class="text-gray-500">E-mail</span>
				<span class="text-gray-800">{selectedUser.email ?? '—'}</span>
			</div>
			<div class="flex justify-between gap-4">
				<span class="text-gray-500">Poslední přihlášení</span>
				<span class="text-gray-800">{formatDate(selectedUser.lastLogin)}</span>
			</div>
			<div class="flex justify-between gap-4">
				<span class="text-gray-500">Vytvořen</span>
				<span class="text-gray-800">{formatDate(selectedUser.createdAt)}</span>
			</div>
			<div class="flex justify-between gap-4">
				<span class="text-gray-500">Poslední akce</span>
				<span class="text-gray-800">{formatDate(selectedUser.lastAction)}</span>
			</div>
		</div>
	</div>

	{#if error}
		<div class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
	{/if}
{/if}

<CreateUserDialog bind:open={createUserOpen} onSuccess={loadUsers} />
<BulkCreateDialog bind:open={bulkCreateOpen} onSuccess={loadUsers} />
<EditUserDialog bind:open={editUserOpen} user={selectedUser} onSuccess={loadUsers} />
<ChangeRoleDialog bind:open={changeRoleOpen} user={selectedUser} onSuccess={loadUsers} />
<CapabilitiesDialog bind:open={capabilitiesOpen} user={selectedUser} onSuccess={loadUsers} />
<DeleteUserDialog bind:open={deleteUserOpen} user={selectedUser} onSuccess={loadUsers} />
<SessionsDialog bind:open={sessionsOpen} user={selectedUser} onSuccess={loadUsers} />
