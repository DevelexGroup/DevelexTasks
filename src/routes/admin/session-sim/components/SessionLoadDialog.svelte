<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { getAllUsers } from '$lib/api/user-management';
	import { getMyGroupMembers } from '$lib/api/groups';
	import { getTestSessions } from '$lib/api/test-sessions';
	import { hasCapability } from '$lib/utils/capabilityGuard';
	import { authUser } from '$lib/stores/auth';
	import { SortBy, SortDirection } from '$lib/types/api.types';
	import type { TestSessionDTO, UserDTO } from '$lib/types/api.types';
	import { loadFromFiles, loadRemoteSession } from '$lib/utils/sessionSim/loaders';
	import type { LoadedSession } from '$lib/utils/sessionSim/types';

	let {
		open = $bindable(false),
		onConfirm
	}: {
		open?: boolean;
		onConfirm?: (session: LoadedSession) => void;
	} = $props();

	type DataSource = 'remote' | 'files';
	let dataSource = $state<DataSource>('remote');

	let isLoading = $state(false);
	let error = $state('');

	// ── Remote state ──
	let remoteUsers = $state<UserDTO[]>([]);
	let remoteSessions = $state<TestSessionDTO[]>([]);
	let selectedRemoteUserId = $state('');
	let selectedRemoteSessionId = $state('');
	let isLoadingUsers = $state(false);
	let isLoadingSessions = $state(false);

	// ── File state ──
	let droppedFiles = $state<File[]>([]);
	let dragOver = $state(false);

	$effect(() => {
		if (open && dataSource === 'remote' && remoteUsers.length === 0) {
			loadRemoteUsers();
		}
	});

	$effect(() => {
		const uid = selectedRemoteUserId;
		selectedRemoteSessionId = '';
		remoteSessions = [];
		if (uid) loadRemoteSessions(uid);
	});

	async function loadRemoteUsers() {
		isLoadingUsers = true;
		error = '';
		try {
			const raw = hasCapability($authUser, 'USER_READ_ALL')
				? await getAllUsers()
				: await getMyGroupMembers();
			remoteUsers = raw.slice().sort((a, b) => a.username.localeCompare(b.username, 'cs'));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se načíst uživatele';
		} finally {
			isLoadingUsers = false;
		}
	}

	async function loadRemoteSessions(userId: string) {
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

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleString('cs-CZ', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function confirm() {
		isLoading = true;
		error = '';
		try {
			let session: LoadedSession;
			if (dataSource === 'remote') {
				const user = remoteUsers.find((u) => u.id === selectedRemoteUserId);
				session = await loadRemoteSession(selectedRemoteSessionId, user?.username);
			} else {
				session = await loadFromFiles(droppedFiles);
			}
			if (session.rawGazeData.length === 0 && session.gazeSamples.length === 0) {
				error = 'Nenalezena žádná data sezení (rawGazeData/gazeSamples).';
				return;
			}
			onConfirm?.(session);
			open = false;
			droppedFiles = [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se načíst data';
		} finally {
			isLoading = false;
		}
	}

	const canConfirm = $derived(
		dataSource === 'remote'
			? !!selectedRemoteUserId && !!selectedRemoteSessionId
			: droppedFiles.length > 0
	);

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;
		if (event.dataTransfer?.files) {
			droppedFiles = [...droppedFiles, ...Array.from(event.dataTransfer.files)];
		}
	}

	function handleFileInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		if (input.files) droppedFiles = [...droppedFiles, ...Array.from(input.files)];
		input.value = '';
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Načíst sezení</Dialog.Title>
			<Dialog.Description>
				Vyberte zdroj nahraných dat sezení (včetně rawGazeData).
			</Dialog.Description>
		</Dialog.Header>

		<div class="flex border-b border-gray-200">
			<button
				type="button"
				class="flex-1 px-4 py-2 text-sm font-medium transition-colors {dataSource === 'remote'
					? 'border-b-2 border-blue-500 text-blue-600'
					: 'text-gray-500 hover:text-gray-700'}"
				onclick={() => (dataSource = 'remote')}
			>
				Vzdálený server
			</button>
			<button
				type="button"
				class="flex-1 px-4 py-2 text-sm font-medium transition-colors {dataSource === 'files'
					? 'border-b-2 border-blue-500 text-blue-600'
					: 'text-gray-500 hover:text-gray-700'}"
				onclick={() => (dataSource = 'files')}
			>
				Soubory (CSV/JSON/ZIP)
			</button>
		</div>

		{#if error}
			<div class="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
		{/if}

		<div class="space-y-4 py-4">
			{#if dataSource === 'remote'}
				<div class="space-y-2">
					<label for="sim-remote-user" class="text-sm font-medium text-gray-700">Uživatel:</label>
					<select
						id="sim-remote-user"
						bind:value={selectedRemoteUserId}
						disabled={isLoadingUsers}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800 disabled:bg-gray-100"
					>
						<option value="">{isLoadingUsers ? 'Načítám…' : 'Vyberte uživatele…'}</option>
						{#each remoteUsers as user (user.id)}
							<option value={user.id}>{user.username}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<label for="sim-remote-session" class="text-sm font-medium text-gray-700">Sezení:</label>
					<select
						id="sim-remote-session"
						bind:value={selectedRemoteSessionId}
						disabled={!selectedRemoteUserId || isLoadingSessions}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800 disabled:cursor-not-allowed disabled:bg-gray-100"
					>
						<option value="">{isLoadingSessions ? 'Načítám…' : 'Vyberte sezení…'}</option>
						{#each remoteSessions as session (session.id)}
							<option value={session.id}>
								[{session.testType}] {formatDate(session.sessionStartTime)}
							</option>
						{/each}
					</select>
				</div>
			{:else}
				<div
					role="button"
					tabindex="0"
					class="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-6 text-sm transition-colors {dragOver
						? 'border-blue-400 bg-blue-50 text-blue-600'
						: 'border-gray-300 text-gray-500 hover:border-gray-400'}"
					ondragover={(e) => {
						e.preventDefault();
						dragOver = true;
					}}
					ondragleave={() => (dragOver = false)}
					ondrop={handleDrop}
					onclick={() => document.getElementById('sim-file-input')?.click()}
					onkeydown={(e) => {
						if (e.key === 'Enter') document.getElementById('sim-file-input')?.click();
					}}
				>
					Přetáhněte sem soubory sezení (CSV, aoiGeometry/meta JSON) nebo ZIP, nebo klikněte pro
					výběr
				</div>
				<input
					id="sim-file-input"
					type="file"
					multiple
					accept=".csv,.zip,.json"
					class="hidden"
					onchange={handleFileInput}
				/>

				{#if droppedFiles.length > 0}
					<ul class="max-h-32 space-y-1 overflow-y-auto text-sm text-gray-700">
						{#each droppedFiles as file, i (file.name + i)}
							<li class="flex items-center justify-between gap-2">
								<span class="truncate">{file.name}</span>
								<button
									type="button"
									class="text-xs text-red-500 hover:underline"
									onclick={() => (droppedFiles = droppedFiles.filter((_, j) => j !== i))}
								>
									odebrat
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)}>Zavřít</Button>
			<Button onclick={confirm} disabled={!canConfirm || isLoading}>
				{isLoading ? 'Načítám…' : 'Načíst'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
