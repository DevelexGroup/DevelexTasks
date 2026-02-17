<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import {
		getAllUsers,
		activateUser,
		deactivateUser,
		lockUser,
		unlockUser,
		deleteUser
	} from '$lib/api/user-management';
	import { UserRole, UserStatus, type UserBasicDTO } from '$lib/types/api.types';
	import CreateUserDialog from './components/CreateUserDialog.svelte';
	import BulkCreateDialog from './components/BulkCreateDialog.svelte';
	import EditUserDialog from './components/EditUserDialog.svelte';
	import ChangeRoleDialog from './components/ChangeRoleDialog.svelte';

	// State
	let users = $state<UserBasicDTO[]>([]);
	let isLoading = $state(true);
	let error = $state('');
	let filterStatus = $state<UserStatus | ''>('');
	let filterRole = $state<UserRole | ''>('');
	let searchQuery = $state('');

	// Dialog states
	let createUserOpen = $state(false);
	let bulkCreateOpen = $state(false);
	let editUserOpen = $state(false);
	let changeRoleOpen = $state(false);
	let selectedUser = $state<UserBasicDTO | null>(null);

	// Filtered users
	let filteredUsers = $derived(() => {
		let result = users;

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(u) =>
					u.username.toLowerCase().includes(query) ||
					u.email.toLowerCase().includes(query) ||
					u.firstName.toLowerCase().includes(query) ||
					u.lastName.toLowerCase().includes(query)
			);
		}

		return result;
	});

	onMount(() => {
		loadUsers();
	});

	async function loadUsers() {
		isLoading = true;
		error = '';
		try {
			users = await getAllUsers(
				filterStatus ? filterStatus : undefined,
				filterRole ? filterRole : undefined
			);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se načíst uživatele';
		} finally {
			isLoading = false;
		}
	}

	async function handleStatusAction(user: UserBasicDTO) {
		try {
			switch (user.status) {
				case UserStatus.Unactive:
				case UserStatus.Pending:
					await activateUser(user.uuid);
					break;
				case UserStatus.Active:
					await deactivateUser(user.uuid);
					break;
				case UserStatus.Locked:
					await unlockUser(user.uuid);
					break;
			}
			await loadUsers();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Akce se nezdařila';
		}
	}

	async function handleLockUser(user: UserBasicDTO) {
		try {
			await lockUser(user.uuid);
			await loadUsers();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se zamknout uživatele';
		}
	}

	async function handleDeleteUser(user: UserBasicDTO) {
		if (!confirm(`Opravdu chcete smazat uživatele ${user.username}?`)) {
			return;
		}
		try {
			await deleteUser(user.uuid);
			await loadUsers();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se smazat uživatele';
		}
	}

	function openEditDialog(user: UserBasicDTO) {
		selectedUser = user;
		editUserOpen = true;
	}

	function openChangeRoleDialog(user: UserBasicDTO) {
		selectedUser = user;
		changeRoleOpen = true;
	}

	function getStatusLabel(status: UserStatus): string {
		switch (status) {
			case UserStatus.Active:
				return 'Aktivní';
			case UserStatus.Unactive:
				return 'Neaktivní';
			case UserStatus.Locked:
				return 'Zamčený';
			case UserStatus.Pending:
				return 'Čeká na schválení';
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
			case UserStatus.Pending:
				return 'bg-yellow-100 text-yellow-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusActionLabel(status: UserStatus): string {
		switch (status) {
			case UserStatus.Active:
				return 'Deaktivovat';
			case UserStatus.Unactive:
			case UserStatus.Pending:
				return 'Aktivovat';
			case UserStatus.Locked:
				return 'Odemknout';
			default:
				return 'Změnit stav';
		}
	}

	function getRoleLabel(role: UserRole): string {
		switch (role) {
			case UserRole.Garant:
				return 'Garant';
			case UserRole.Lector:
				return 'Lektor';
			case UserRole.Student:
				return 'Student';
			default:
				return role;
		}
	}

	function getRoleColor(role: UserRole): string {
		switch (role) {
			case UserRole.Garant:
				return 'bg-purple-100 text-purple-800';
			case UserRole.Lector:
				return 'bg-blue-100 text-blue-800';
			case UserRole.Student:
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function exportUsersToCsv() {
		if (users.length === 0) {
			error = 'Žádní uživatelé k exportu';
			return;
		}

		const headers = ['UUID', 'Username', 'Email', 'Jméno', 'Příjmení', 'Role', 'Status'];
		const rows = users.map((u) => [
			u.uuid,
			u.username,
			u.email,
			u.firstName,
			u.lastName,
			u.userType,
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

	function handleFilterChange() {
		loadUsers();
	}
</script>

<svelte:head>
	<title>Správa uživatelů</title>
	<meta name="description" content="User management admin page for Develex Tasks" />
</svelte:head>

<!-- Header with filters -->
<section class="absolute top-4 left-4 flex h-16 items-center gap-4">
	<div class="flex flex-col">
		<label for="filterStatus" class="mb-1 text-sm font-medium text-gray-700">Status:</label>
		<select
			id="filterStatus"
			bind:value={filterStatus}
			onchange={handleFilterChange}
			class="min-w-[150px] rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-800"
		>
			<option value="">Všechny</option>
			<option value={UserStatus.Active}>Aktivní</option>
			<option value={UserStatus.Unactive}>Neaktivní</option>
			<option value={UserStatus.Locked}>Zamčení</option>
			<option value={UserStatus.Pending}>Čekající</option>
		</select>
	</div>

	<div class="flex flex-col">
		<label for="filterRole" class="mb-1 text-sm font-medium text-gray-700">Role:</label>
		<select
			id="filterRole"
			bind:value={filterRole}
			onchange={handleFilterChange}
			class="min-w-[150px] rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-800"
		>
			<option value="">Všechny</option>
			<option value={UserRole.Garant}>Garant</option>
			<option value={UserRole.Lector}>Lektor</option>
			<option value={UserRole.Student}>Student</option>
		</select>
	</div>

	<div class="flex flex-col">
		<label for="search" class="mb-1 text-sm font-medium text-gray-700">Hledat:</label>
		<input
			id="search"
			type="text"
			bind:value={searchQuery}
			placeholder="Jméno, email..."
			class="min-w-[200px] rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-800"
		/>
	</div>
</section>

<!-- Action buttons -->
<section class="absolute top-4 right-4 flex items-center gap-2">
	<button
		class="mt-6 rounded-md bg-green-500 px-3 py-1.5 text-gray-50 hover:bg-green-600"
		onclick={() => (createUserOpen = true)}
	>
		+ Nový uživatel
	</button>
	<button
		class="mt-6 rounded-md bg-purple-500 px-3 py-1.5 text-gray-50 hover:bg-purple-600"
		onclick={() => (bulkCreateOpen = true)}
	>
		Hromadné vytvoření
	</button>
	<button
		class="mt-6 rounded-md bg-blue-500 px-3 py-1.5 text-gray-50 hover:bg-blue-600"
		onclick={exportUsersToCsv}
	>
		Exportovat CSV
	</button>
</section>

<!-- Users table -->
<section class="table-container mt-24 mb-16 flex w-full flex-col overflow-auto bg-gray-100 px-4">
	{#if isLoading}
		<div class="flex h-full items-center justify-center">
			<p class="text-lg text-gray-500">Načítání...</p>
		</div>
	{:else if error}
		<div class="flex h-full flex-col items-center justify-center gap-4">
			<p class="text-lg text-red-500">{error}</p>
			<button
				class="rounded-md bg-blue-500 px-3 py-1.5 text-white hover:bg-blue-600"
				onclick={loadUsers}
			>
				Zkusit znovu
			</button>
		</div>
	{:else if filteredUsers().length === 0}
		<div class="flex h-full items-center justify-center">
			<p class="text-lg text-gray-500">Žádní uživatelé</p>
		</div>
	{:else}
		<div class="overflow-x-auto rounded-lg bg-white shadow">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="sticky top-0 bg-gray-50">
					<tr>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
						>
							Uživatel
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
						>
							E-mail
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
						>
							Role
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
						>
							Status
						</th>
						<th
							class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
						>
							Akce
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each filteredUsers() as user, i (user.uuid)}
						<tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex flex-col">
									<span class="text-sm font-medium text-gray-900"
										>{user.firstName} {user.lastName}</span
									>
									<span class="text-sm text-gray-500">@{user.username}</span>
								</div>
							</td>
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
								{user.email}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {getRoleColor(
										user.userType
									)}"
								>
									{getRoleLabel(user.userType)}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {getStatusColor(
										user.status
									)}"
								>
									{getStatusLabel(user.status)}
								</span>
							</td>
							<td class="px-6 py-4 text-right text-sm whitespace-nowrap">
								<div class="flex justify-end gap-2">
									<button
										class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200"
										onclick={() => openEditDialog(user)}
									>
										Upravit
									</button>
									<button
										class="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700 hover:bg-purple-200"
										onclick={() => openChangeRoleDialog(user)}
									>
										Role
									</button>
									<button
										class="rounded px-2 py-1 text-xs {user.status === UserStatus.Active
											? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
											: 'bg-green-100 text-green-700 hover:bg-green-200'}"
										onclick={() => handleStatusAction(user)}
									>
										{getStatusActionLabel(user.status)}
									</button>
									{#if user.status === UserStatus.Active}
										<button
											class="rounded bg-orange-100 px-2 py-1 text-xs text-orange-700 hover:bg-orange-200"
											onclick={() => handleLockUser(user)}
										>
											Zamknout
										</button>
									{/if}
									<button
										class="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
										onclick={() => handleDeleteUser(user)}
									>
										Smazat
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>

<!-- Footer -->
<div class="fixed bottom-4 left-4 flex gap-1">
	<button
		class="rounded-md bg-gray-300 px-3 py-1.5 text-gray-800"
		onclick={() => goto(resolve(`/admin`))}
	>
		Zpět
	</button>
</div>

<div class="fixed right-4 bottom-4 flex gap-1">
	<span class="text-gray-700">Celkem uživatelů: {filteredUsers().length}</span>
</div>

<!-- Dialogs -->
<CreateUserDialog bind:open={createUserOpen} onSuccess={loadUsers} />
<BulkCreateDialog bind:open={bulkCreateOpen} onSuccess={loadUsers} />
<EditUserDialog bind:open={editUserOpen} user={selectedUser} onSuccess={loadUsers} />
<ChangeRoleDialog bind:open={changeRoleOpen} user={selectedUser} onSuccess={loadUsers} />

<style>
	.table-container {
		height: calc(100vh - 10rem);
	}
</style>

