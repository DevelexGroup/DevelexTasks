<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { get } from 'svelte/store';
	import * as Tabs from '$lib/components/ui/tabs';
	import UsersPanel from './components/UsersPanel.svelte';
	import GroupsPanel from './components/GroupsPanel.svelte';
	import { hasCapability } from '$lib/utils/capabilityGuard';
	import { authUser } from '$lib/stores/auth';

	let showUsers = $derived(hasCapability($authUser, 'USER_READ_ALL'));
	let showGroups = $derived(hasCapability($authUser, 'GROUP_READ_OWN', 'GROUP_READ_ALL'));

	let activeTab = $state(hasCapability(get(authUser), 'USER_READ_ALL') ? 'users' : 'groups');
</script>

<svelte:head>
	<title>Správa uživatelů</title>
	<meta name="description" content="User and group management for DeveLex Tasks" />
</svelte:head>

<section class="min-h-screen overflow-auto bg-gray-100 pb-20">
	<div class="mx-auto max-w-5xl px-4 py-6">
		<h1 class="mb-6 text-2xl font-black text-gray-800">Správa uživatelů</h1>

		{#if showUsers && showGroups}
			<Tabs.Root bind:value={activeTab} class="w-full">
				<Tabs.List class="mb-4 grid w-full max-w-sm grid-cols-2">
					<Tabs.Trigger value="users">Uživatelé</Tabs.Trigger>
					<Tabs.Trigger value="groups">Skupiny</Tabs.Trigger>
				</Tabs.List>

				<Tabs.Content value="users">
					<UsersPanel />
				</Tabs.Content>
				<Tabs.Content value="groups">
					<GroupsPanel />
				</Tabs.Content>
			</Tabs.Root>
		{:else if showUsers}
			<UsersPanel />
		{:else if showGroups}
			<GroupsPanel />
		{/if}
	</div>
</section>

<div class="fixed bottom-4 left-4 flex gap-1">
	<button class="rounded-md bg-gray-300 px-3 py-1.5 text-gray-800" onclick={() => goto(resolve('/'))}>
		Zpět
	</button>
</div>
