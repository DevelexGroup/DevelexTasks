<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { get } from 'svelte/store';
	import * as Tabs from '$lib/components/ui/tabs';
	import UsersPanel from './components/UsersPanel.svelte';
	import GroupsPanel from './components/GroupsPanel.svelte';
	import { hasCapability } from '$lib/utils/capabilityGuard';
	import { authUser } from '$lib/stores/auth';
	import BackButton from '$lib/components/layout/BackButton.svelte';

	let showUsers = $derived(hasCapability($authUser, 'USER_READ_ALL'));
	let showGroups = $derived(hasCapability($authUser, 'GROUP_READ_OWN', 'GROUP_READ_ALL'));

	let activeTab = $state(hasCapability(get(authUser), 'USER_READ_ALL') ? 'users' : 'groups');

	let usersDetailOpen = $state(false);
	let groupsDetailOpen = $state(false);

	let inDetail = $derived(
		showUsers && showGroups
			? activeTab === 'users'
				? usersDetailOpen
				: groupsDetailOpen
			: showUsers
				? usersDetailOpen
				: groupsDetailOpen
	);
</script>

<svelte:head>
	<title>Správa uživatelů</title>
	<meta name="description" content="User and group management for DeveLex Tasks" />
</svelte:head>

<section class="min-h-screen overflow-auto bg-gray-100 pb-20">
	<div class="mx-auto max-w-5xl px-4 py-6">
		{#if !inDetail}
			<div class="mb-4">
				<BackButton label="Zpět do hlavní nabídky" onclick={() => goto(resolve(`/`))} />
			</div>
		{/if}

		<h1 class="mb-6 text-2xl font-black text-gray-800">Správa uživatelů</h1>

		{#if showUsers && showGroups}
			<Tabs.Root bind:value={activeTab} class="w-full">
				<Tabs.List class="mb-4 grid w-full max-w-sm grid-cols-2">
					<Tabs.Trigger value="users">Uživatelé</Tabs.Trigger>
					<Tabs.Trigger value="groups">Skupiny</Tabs.Trigger>
				</Tabs.List>

				<Tabs.Content value="users">
					<UsersPanel bind:detailOpen={usersDetailOpen} />
				</Tabs.Content>
				<Tabs.Content value="groups">
					<GroupsPanel bind:detailOpen={groupsDetailOpen} />
				</Tabs.Content>
			</Tabs.Root>
		{:else if showUsers}
			<UsersPanel bind:detailOpen={usersDetailOpen} />
		{:else if showGroups}
			<GroupsPanel bind:detailOpen={groupsDetailOpen} />
		{/if}
	</div>
</section>
