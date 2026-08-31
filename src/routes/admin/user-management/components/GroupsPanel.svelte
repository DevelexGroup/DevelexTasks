<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import {
		getAllGroups,
		getMyGroups,
		createGroup,
		updateGroup,
		deleteGroup,
		getGroupMembers,
		findAddableUsers,
		addMemberByUsername,
		removeMember,
		createStudentInGroup
	} from '$lib/api/groups';
	import { hasCapability } from '$lib/utils/capabilityGuard';
	import { authUser } from '$lib/stores/auth';
	import {
		UserRole,
		roleLabels,
		type GroupDTO,
		type GroupMemberDTO,
		type UserLookupDTO
	} from '$lib/types/api.types';
	import { ApiError } from '$lib/api/client';
	import IconButton from '$lib/components/IconButton.svelte';

	let { detailOpen = $bindable(false) } = $props();

	let groups = $state<GroupDTO[]>([]);
	let members = $state<GroupMemberDTO[]>([]);
	let selectedGroupId = $state('');
	let searchQuery = $state('');

	let isLoadingGroups = $state(true);
	let isLoadingMembers = $state(false);
	let error = $state('');

	let detailMenuOpen = $state(false);
	let detailMenuRef = $state<HTMLDivElement | null>(null);
	let canManageAllGroups = $derived(hasCapability($authUser, 'GROUP_MANAGE_ALL'));
	let canManageMembers = $derived(hasCapability($authUser, 'GROUP_MANAGE_OWN', 'GROUP_MANAGE_ALL'));
	let canCreateGroup = $derived(hasCapability($authUser, 'GROUP_CREATE', 'GROUP_MANAGE_ALL'));
	let canEditOwnedGroups = $derived(hasCapability($authUser, 'GROUP_EDIT_OWNED', 'GROUP_MANAGE_ALL'));
	let canCreateStudent = $derived(
		hasCapability($authUser, 'USER_CREATE_STUDENT_IN_GROUP', 'USER_CREATE_ANY')
	);

	let selectedGroup = $derived(groups.find((g) => g.id === selectedGroupId) ?? null);

	$effect(() => {
		detailOpen = !!selectedGroup;
	});

	let canEditSelectedGroup = $derived(
		!!selectedGroup && canEditOwnedGroups && (canManageAllGroups || selectedGroup.ownedByMe)
	);

	let filteredGroups = $derived.by(() => {
		const query = searchQuery.toLowerCase();
		return groups.filter(
			(g) =>
				!query ||
				g.name.toLowerCase().includes(query) ||
				(g.description ?? '').toLowerCase().includes(query)
		);
	});

	// Dialog state
	let groupDialogOpen = $state(false);
	let editingGroup = $state<GroupDTO | null>(null);
	let groupName = $state('');
	let groupDescription = $state('');
	let deleteGroupOpen = $state(false);
	let addMemberOpen = $state(false);
	let memberSearchQuery = $state('');
	let memberResults = $state<UserLookupDTO[]>([]);
	let isSearchingMembers = $state(false);
	let selectedCandidate = $state<UserLookupDTO | null>(null);
	let createStudentOpen = $state(false);
	let studentUsername = $state('');
	let studentPassword = $state('');
	let studentConfirmPassword = $state('');
	let studentFirstName = $state('');
	let studentLastName = $state('');
	let studentEmail = $state('');
	let removeMemberTarget = $state<GroupMemberDTO | null>(null);
	let dialogError = $state('');
	let isSubmitting = $state(false);

	function handleWindowClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (detailMenuOpen && detailMenuRef && !detailMenuRef.contains(target)) {
			detailMenuOpen = false;
		}
	}

	function handleWindowKey(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			detailMenuOpen = false;
		}
	}

	onMount(() => {
		loadGroups();
	});

	async function loadGroups() {
		isLoadingGroups = true;
		error = '';
		try {
			const raw = canManageAllGroups ? await getAllGroups() : await getMyGroups();
			groups = raw.slice().sort((a, b) => a.name.localeCompare(b.name, 'cs'));
			if (selectedGroupId && !groups.some((g) => g.id === selectedGroupId)) {
				selectedGroupId = '';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se načíst skupiny';
		} finally {
			isLoadingGroups = false;
		}
	}

	async function loadMembers(groupId: string) {
		if (!groupId) {
			members = [];
			return;
		}
		isLoadingMembers = true;
		error = '';
		try {
			members = await getGroupMembers(groupId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se načíst členy skupiny';
		} finally {
			isLoadingMembers = false;
		}
	}

	$effect(() => {
		const gid = selectedGroupId;
		members = [];
		if (gid) {
			loadMembers(gid);
		}
	});

	function openCreateGroup() {
		editingGroup = null;
		groupName = '';
		groupDescription = '';
		dialogError = '';
		groupDialogOpen = true;
	}

	function openRenameGroup(group: GroupDTO) {
		editingGroup = group;
		groupName = group.name;
		groupDescription = group.description ?? '';
		dialogError = '';
		groupDialogOpen = true;
	}

	async function handleSaveGroup() {
		dialogError = '';
		if (!groupName.trim()) {
			dialogError = 'Zadejte název skupiny';
			return;
		}
		isSubmitting = true;
		try {
			if (editingGroup) {
				await updateGroup(editingGroup.id, { name: groupName, description: groupDescription });
			} else {
				await createGroup({ name: groupName, description: groupDescription });
			}
			groupDialogOpen = false;
			await loadGroups();
		} catch (err) {
			dialogError =
				err instanceof ApiError && err.status === 409
					? 'Skupina s tímto názvem už existuje'
					: 'Nepodařilo se uložit skupinu';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDeleteGroup() {
		if (!selectedGroup) return;
		isSubmitting = true;
		dialogError = '';
		try {
			await deleteGroup(selectedGroup.id);
			deleteGroupOpen = false;
			selectedGroupId = '';
			await loadGroups();
		} catch {
			dialogError = 'Nepodařilo se smazat skupinu';
		} finally {
			isSubmitting = false;
		}
	}

	function resetAddMemberForm() {
		memberSearchQuery = '';
		memberResults = [];
		selectedCandidate = null;
		isSearchingMembers = false;
	}

	function candidateName(candidate: UserLookupDTO): string {
		const name = `${candidate.firstName ?? ''} ${candidate.lastName ?? ''}`.trim();
		return name || candidate.username;
	}

	$effect(() => {
		const query = memberSearchQuery.trim();
		const groupId = selectedGroupId;
		if (!addMemberOpen || !groupId || query.length < 2) {
			memberResults = [];
			isSearchingMembers = false;
			return;
		}

		isSearchingMembers = true;
		const handle = setTimeout(async () => {
			try {
				memberResults = await findAddableUsers(groupId, query);
			} catch {
				memberResults = [];
			} finally {
				isSearchingMembers = false;
			}
		}, 250);

		return () => clearTimeout(handle);
	});

	async function handleAddMember() {
		if (!selectedGroupId) return;
		dialogError = '';
		if (!selectedCandidate) {
			dialogError = 'Vyberte uživatele ze seznamu';
			return;
		}
		isSubmitting = true;
		try {
			await addMemberByUsername(selectedGroupId, { username: selectedCandidate.username });
			addMemberOpen = false;
			resetAddMemberForm();
			await loadMembers(selectedGroupId);
			await loadGroups();
		} catch (err) {
			if (err instanceof ApiError && err.status === 404) {
				dialogError = 'Uživatel nenalezen';
			} else if (err instanceof ApiError && err.status === 409) {
				dialogError = 'Uživatel už je členem skupiny';
			} else {
				dialogError = 'Nepodařilo se přidat člena';
			}
		} finally {
			isSubmitting = false;
		}
	}

	async function handleCreateStudent() {
		if (!selectedGroupId) return;
		dialogError = '';
		if (!studentUsername || !studentPassword) {
			dialogError = 'Vyplňte uživatelské jméno a heslo';
			return;
		}
		if (studentUsername.length < 3) {
			dialogError = 'Uživatelské jméno musí mít alespoň 3 znaky';
			return;
		}
		if (studentPassword.length < 6) {
			dialogError = 'Heslo musí mít alespoň 6 znaků';
			return;
		}
		if (studentPassword !== studentConfirmPassword) {
			dialogError = 'Hesla se neshodují';
			return;
		}
		isSubmitting = true;
		try {
			await createStudentInGroup(selectedGroupId, {
				username: studentUsername,
				password: studentPassword,
				firstName: studentFirstName,
				lastName: studentLastName,
				email: studentEmail
			});
			createStudentOpen = false;
			resetStudentForm();
			await loadMembers(selectedGroupId);
			await loadGroups();
		} catch (err) {
			dialogError =
				err instanceof ApiError && err.message.includes('already')
					? 'Uživatelské jméno už existuje'
					: 'Nepodařilo se vytvořit studenta';
		} finally {
			isSubmitting = false;
		}
	}

	function resetStudentForm() {
		studentUsername = '';
		studentPassword = '';
		studentConfirmPassword = '';
		studentFirstName = '';
		studentLastName = '';
		studentEmail = '';
	}

	async function handleRemoveMember() {
		if (!selectedGroupId || !removeMemberTarget) return;
		isSubmitting = true;
		dialogError = '';
		try {
			await removeMember(selectedGroupId, removeMemberTarget.userUuid);
			const removedSelf = removeMemberTarget.userUuid === $authUser?.userId;
			removeMemberTarget = null;
			if (removedSelf && !canManageAllGroups) {
				selectedGroupId = '';
				await loadGroups();
			} else {
				await loadMembers(selectedGroupId);
				await loadGroups();
			}
		} catch {
			dialogError = 'Nepodařilo se odebrat člena';
		} finally {
			isSubmitting = false;
		}
	}

	function canRemove(member: GroupMemberDTO): boolean {
		if (member.userUuid === selectedGroup?.ownerUuid) return false;
		if (canManageAllGroups) return true;
		if (!canManageMembers) return false;
		if (selectedGroup?.ownedByMe) return true;
		return member.role === UserRole.Student || member.userUuid === $authUser?.userId;
	}

	function displayName(member: GroupMemberDTO): string {
		const name = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
		return name || member.username;
	}

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

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('cs-CZ', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKey} />

{#if !selectedGroup}
	<div class="mb-4 flex items-center gap-2">
		<div class="relative flex-1">
			<Icon
				icon="material-symbols:search"
				class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
			/>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Hledat skupinu…"
				class="w-full rounded-md border border-gray-300 bg-white py-2 pr-3 pl-10 text-gray-800"
			/>
		</div>
		{#if canCreateGroup}
			<button
				class="shrink-0 rounded-md bg-green-500 px-3 py-2 text-sm text-gray-50 hover:bg-green-600"
				onclick={openCreateGroup}
			>
				+ Vytvořit skupinu
			</button>
		{/if}
	</div>

	{#if isLoadingGroups}
		<div class="flex h-48 items-center justify-center rounded-xl bg-white shadow-md shadow-gray-300/50">
			<p class="text-lg text-gray-500">Načítání…</p>
		</div>
	{:else if error}
		<div class="flex h-48 flex-col items-center justify-center gap-4 rounded-xl bg-white shadow-md shadow-gray-300/50">
			<p class="text-lg text-red-500">{error}</p>
			<button
				class="rounded-md bg-blue-500 px-3 py-1.5 text-white hover:bg-blue-600"
				onclick={loadGroups}
			>
				Zkusit znovu
			</button>
		</div>
	{:else if groups.length === 0}
		<div class="flex h-48 items-center justify-center rounded-xl bg-white shadow-md shadow-gray-300/50">
			<p class="px-6 text-center text-lg text-gray-500">
				{#if canManageAllGroups}
					Zatím neexistují žádné skupiny
				{:else if canCreateGroup}
					Zatím nemáte žádnou skupinu — vytvořte si první.
				{:else}
					Nejste členem žádné skupiny — kontaktujte administrátora.
				{/if}
			</p>
		</div>
	{:else if filteredGroups.length === 0}
		<div class="flex h-48 items-center justify-center rounded-xl bg-white shadow-md shadow-gray-300/50">
			<p class="text-lg text-gray-500">Žádné skupiny neodpovídají hledání</p>
		</div>
	{:else}
		<div class="divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-md shadow-gray-300/50">
			{#each filteredGroups as group (group.id)}
				<button
					type="button"
					class="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-3 text-left transition-colors hover:bg-gray-50"
					onclick={() => (selectedGroupId = group.id)}
				>
					<div class="min-w-0">
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium text-gray-900">{group.name}</span>
							{#if group.ownedByMe && !canManageAllGroups}
								<span class="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
									Vlastník
								</span>
							{/if}
						</div>
						{#if group.description}
							<p class="truncate text-xs text-gray-500">{group.description}</p>
						{/if}
					</div>
					<span class="shrink-0 text-xs text-gray-400">{group.memberCount ?? 0} členů</span>
				</button>
			{/each}
		</div>
	{/if}
{:else}
	<div class="mb-4">
		<button
			class="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
			onclick={() => (selectedGroupId = '')}
		>
			<Icon icon="mdi:arrow-left" class="h-4 w-4" />
			Zpět na seznam
		</button>
	</div>

	<div class="mb-6 rounded-xl bg-white p-5 shadow-md shadow-gray-300/50">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="flex items-center gap-4">
				<div class="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-rose-100">
					<Icon icon="material-symbols:groups" class="h-6 w-6 text-rose-700" />
				</div>
				<div>
					<div class="flex items-center gap-2">
						<h2 class="text-lg font-bold text-gray-800">{selectedGroup.name}</h2>
						{#if selectedGroup.ownedByMe}
							<span class="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
								Vlastník
							</span>
						{:else if canManageMembers}
							<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
								Sdílená
							</span>
						{/if}
					</div>
					{#if selectedGroup.description}
						<p class="text-sm text-gray-500">{selectedGroup.description}</p>
					{/if}
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-1">
				{#if canManageMembers}
					<IconButton
						icon="material-symbols:person-add"
						label="Přidat člena"
						variant="primary"
						onclick={() => {
							resetAddMemberForm();
							dialogError = '';
							addMemberOpen = true;
						}}
					/>
				{/if}
				{#if canCreateStudent}
					<IconButton
						icon="material-symbols:school"
						label="Vytvořit studenta"
						variant="success"
						onclick={() => {
							resetStudentForm();
							dialogError = '';
							createStudentOpen = true;
						}}
					/>
				{/if}
				{#if canEditSelectedGroup}
					<div class="relative" bind:this={detailMenuRef}>
						<button
							type="button"
							aria-label="Akce skupiny"
							aria-haspopup="menu"
							aria-expanded={detailMenuOpen}
							class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
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
										openRenameGroup(selectedGroup);
									}}
								>
									<Icon icon="material-symbols:edit-outline" class="h-4 w-4" />
									Upravit skupinu
								</button>
								<button
									type="button"
									role="menuitem"
									class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
									onclick={() => {
										detailMenuOpen = false;
										dialogError = '';
										deleteGroupOpen = true;
									}}
								>
									<Icon icon="material-symbols:delete-outline" class="h-4 w-4" />
									Smazat skupinu
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if isLoadingMembers}
		<div class="flex h-48 items-center justify-center rounded-xl bg-white shadow-md shadow-gray-300/50">
			<p class="text-lg text-gray-500">Načítání členů…</p>
		</div>
	{:else if members.length === 0}
		<div class="flex h-48 items-center justify-center rounded-xl bg-white shadow-md shadow-gray-300/50">
			<p class="text-lg text-gray-400">Skupina nemá žádné členy</p>
		</div>
	{:else}
		<div class="rounded-lg bg-white shadow">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
							Člen
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
							Role
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
							Přidán
						</th>
						<th class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
							Akce
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each members as member, i (member.userUuid)}
						<tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex flex-col">
									<span class="text-sm font-medium text-gray-900">{displayName(member)}</span>
									<span class="text-sm text-gray-500">@{member.username}</span>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {getRoleColor(member.role)}"
								>
									{roleLabels[member.role] ?? member.role}
								</span>
							</td>
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
								{formatDate(member.addedAt)}
							</td>
							<td class="px-6 py-4 text-right text-sm whitespace-nowrap">
								{#if canRemove(member)}
									<IconButton
										icon="material-symbols:person-remove-outline"
										label={member.userUuid === $authUser?.userId
											? 'Opustit skupinu'
											: 'Odebrat ze skupiny'}
										variant="danger"
										size="sm"
										onclick={() => {
											dialogError = '';
											removeMemberTarget = member;
										}}
									/>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
{/if}

<!-- Create / rename group dialog -->
<Dialog.Root bind:open={groupDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{editingGroup ? 'Upravit skupinu' : 'Vytvořit skupinu'}</Dialog.Title>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<label for="groupName" class="text-sm font-medium text-gray-700">Název skupiny:</label>
				<input
					id="groupName"
					type="text"
					bind:value={groupName}
					class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
					placeholder="Třída 3.A"
				/>
			</div>
			<div class="space-y-2">
				<label for="groupDescription" class="text-sm font-medium text-gray-700">Popis (volitelné):</label>
				<input
					id="groupDescription"
					type="text"
					bind:value={groupDescription}
					class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
				/>
			</div>
			{#if dialogError}
				<div class="rounded-md bg-red-50 p-3 text-sm text-red-600">{dialogError}</div>
			{/if}
		</div>

		<Dialog.Footer>
			<button
				type="button"
				class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-800 hover:bg-gray-100"
				onclick={() => (groupDialogOpen = false)}
			>
				Zrušit
			</button>
			<button
				type="button"
				class="rounded-md bg-blue-500 px-3 py-1.5 text-white hover:bg-blue-600 disabled:bg-blue-300"
				onclick={handleSaveGroup}
				disabled={isSubmitting}
			>
				{isSubmitting ? 'Ukládám…' : 'Uložit'}
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete group dialog -->
<Dialog.Root bind:open={deleteGroupOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Smazat skupinu</Dialog.Title>
			<Dialog.Description>
				Skupina „{selectedGroup?.name ?? ''}" bude smazána. Uživatelé a jejich data zůstanou
				zachovány, ztratí se pouze členství ve skupině.
			</Dialog.Description>
		</Dialog.Header>

		{#if dialogError}
			<div class="rounded-md bg-red-50 p-3 text-sm text-red-600">{dialogError}</div>
		{/if}

		<Dialog.Footer>
			<button
				type="button"
				class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-800 hover:bg-gray-100"
				onclick={() => (deleteGroupOpen = false)}
			>
				Zrušit
			</button>
			<button
				type="button"
				class="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-50"
				onclick={handleDeleteGroup}
				disabled={isSubmitting}
			>
				{isSubmitting ? 'Mazání…' : 'Smazat skupinu'}
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Add member dialog -->
<Dialog.Root bind:open={addMemberOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Přidat člena</Dialog.Title>
			<Dialog.Description>
				Vyhledejte uživatele podle jména nebo uživatelského jména.
			</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={(e) => { e.preventDefault(); handleAddMember(); }} class="space-y-4 py-4">
			<div class="space-y-2">
				<label for="memberSearch" class="text-sm font-medium text-gray-700">Uživatel:</label>
				<div class="relative">
					<Icon
						icon="material-symbols:search"
						class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
					/>
					<input
						id="memberSearch"
						type="text"
						autocomplete="off"
						bind:value={memberSearchQuery}
						class="w-full rounded-md border border-gray-300 bg-white py-2 pr-3 pl-10 text-gray-800"
						placeholder="Jméno nebo uživatelské jméno…"
					/>
				</div>

				{#if selectedCandidate}
					<div
						class="flex items-center justify-between gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2"
					>
						<div class="min-w-0">
							<p class="truncate text-sm font-medium text-gray-900">
								{candidateName(selectedCandidate)}
							</p>
							<p class="truncate text-xs text-gray-500">
								@{selectedCandidate.username} · {roleLabels[selectedCandidate.role]}
							</p>
						</div>
						<IconButton
							icon="material-symbols:close"
							label="Zrušit výběr"
							size="sm"
							onclick={() => (selectedCandidate = null)}
						/>
					</div>
				{:else if memberSearchQuery.trim().length < 2}
					<p class="text-xs text-gray-500">Zadejte alespoň 2 znaky.</p>
				{:else if isSearchingMembers}
					<p class="text-xs text-gray-500">Hledání…</p>
				{:else if memberResults.length === 0}
					<p class="text-xs text-gray-500">Žádní uživatelé neodpovídají hledání.</p>
				{:else}
					<ul
						class="max-h-56 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200"
					>
						{#each memberResults as candidate (candidate.uuid)}
							<li>
								<button
									type="button"
									class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-gray-50"
									onclick={() => {
										selectedCandidate = candidate;
										dialogError = '';
									}}
								>
									<div class="min-w-0">
										<p class="truncate text-sm text-gray-900">{candidateName(candidate)}</p>
										<p class="truncate text-xs text-gray-500">@{candidate.username}</p>
									</div>
									<span
										class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold {getRoleColor(candidate.role)}"
									>
										{roleLabels[candidate.role]}
									</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
			{#if dialogError}
				<div class="rounded-md bg-red-50 p-3 text-sm text-red-600">{dialogError}</div>
			{/if}
		</form>

		<Dialog.Footer>
			<button
				type="button"
				class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-800 hover:bg-gray-100"
				onclick={() => (addMemberOpen = false)}
			>
				Zrušit
			</button>
			<button
				type="button"
				class="rounded-md bg-blue-500 px-3 py-1.5 text-white hover:bg-blue-600 disabled:bg-blue-300"
				onclick={handleAddMember}
				disabled={isSubmitting || !selectedCandidate}
			>
				{isSubmitting ? 'Přidávám…' : 'Přidat'}
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Create student dialog -->
<Dialog.Root bind:open={createStudentOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Vytvořit studenta</Dialog.Title>
			<Dialog.Description>
				Nový student bude automaticky přidán do skupiny „{selectedGroup?.name ?? ''}" a může se
				ihned přihlásit.
			</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={(e) => { e.preventDefault(); handleCreateStudent(); }} class="space-y-4 py-4">
			<div class="space-y-2">
				<label for="studentUsername" class="text-sm font-medium text-gray-700">Uživatelské jméno:</label>
				<input
					id="studentUsername"
					type="text"
					bind:value={studentUsername}
					class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
					placeholder="jan.novak"
				/>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<label for="studentPassword" class="text-sm font-medium text-gray-700">Heslo:</label>
					<input
						id="studentPassword"
						type="password"
						bind:value={studentPassword}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
						placeholder="••••••••"
					/>
				</div>
				<div class="space-y-2">
					<label for="studentConfirmPassword" class="text-sm font-medium text-gray-700">Potvrzení hesla:</label>
					<input
						id="studentConfirmPassword"
						type="password"
						bind:value={studentConfirmPassword}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
						placeholder="••••••••"
					/>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<label for="studentFirstName" class="text-sm font-medium text-gray-700">Jméno (volitelné):</label>
					<input
						id="studentFirstName"
						type="text"
						bind:value={studentFirstName}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
						placeholder="Jan"
					/>
				</div>
				<div class="space-y-2">
					<label for="studentLastName" class="text-sm font-medium text-gray-700">Příjmení (volitelné):</label>
					<input
						id="studentLastName"
						type="text"
						bind:value={studentLastName}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
						placeholder="Novák"
					/>
				</div>
			</div>
			<div class="space-y-2">
				<label for="studentEmail" class="text-sm font-medium text-gray-700">E-mail (volitelné):</label>
				<input
					id="studentEmail"
					type="email"
					bind:value={studentEmail}
					class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
					placeholder="jan.novak@example.com"
				/>
			</div>
			{#if dialogError}
				<div class="rounded-md bg-red-50 p-3 text-sm text-red-600">{dialogError}</div>
			{/if}
		</form>

		<Dialog.Footer>
			<button
				type="button"
				class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-800 hover:bg-gray-100"
				onclick={() => (createStudentOpen = false)}
			>
				Zrušit
			</button>
			<button
				type="button"
				class="rounded-md bg-green-500 px-3 py-1.5 text-white hover:bg-green-600 disabled:bg-green-300"
				onclick={handleCreateStudent}
				disabled={isSubmitting}
			>
				{isSubmitting ? 'Vytváření…' : 'Vytvořit'}
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Remove member dialog -->
<Dialog.Root open={removeMemberTarget !== null} onOpenChange={(o) => { if (!o) removeMemberTarget = null; }}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Odebrat ze skupiny</Dialog.Title>
			<Dialog.Description>
				{#if removeMemberTarget?.userUuid === $authUser?.userId}
					Opustíte skupinu a ztratíte přístup k výsledkům jejích členů. Znovu vás může přidat
					administrátor.
				{:else}
					Uživatel {removeMemberTarget ? displayName(removeMemberTarget) : ''} bude odebrán ze
					skupiny. Jeho účet a data zůstanou zachovány.
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		{#if dialogError}
			<div class="rounded-md bg-red-50 p-3 text-sm text-red-600">{dialogError}</div>
		{/if}

		<Dialog.Footer>
			<button
				type="button"
				class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-800 hover:bg-gray-100"
				onclick={() => (removeMemberTarget = null)}
			>
				Zrušit
			</button>
			<button
				type="button"
				class="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-50"
				onclick={handleRemoveMember}
				disabled={isSubmitting}
			>
				{isSubmitting ? 'Odebírám…' : 'Odebrat'}
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
