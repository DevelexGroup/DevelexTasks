<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { getUserSessions, expireUserTokens } from '$lib/api/user-management';
	import type { UserDTO, UserSessionsDTO } from '$lib/types/api.types';

	let {
		open = $bindable(false),
		user,
		onSuccess
	}: {
		open?: boolean;
		user: UserDTO | null;
		onSuccess?: () => void;
	} = $props();

	let sessions = $state<UserSessionsDTO | null>(null);
	let isLoading = $state(false);
	let isExpiring = $state(false);
	let error = $state('');
	let successMessage = $state('');

	$effect(() => {
		if (user && open) {
			loadSessions();
		}
	});

	async function loadSessions() {
		if (!user) return;
		isLoading = true;
		error = '';
		successMessage = '';
		try {
			sessions = await getUserSessions(user.id);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se načíst informace o relacích';
		} finally {
			isLoading = false;
		}
	}

	async function handleExpireTokens() {
		if (!user) return;
		isExpiring = true;
		error = '';
		successMessage = '';
		try {
			await expireUserTokens(user.id);
			successMessage = 'Všechny přihlašovací relace byly úspěšně ukončeny';
			await loadSessions();
			onSuccess?.();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se ukončit relace';
		} finally {
			isExpiring = false;
		}
	}

	function formatDate(date: Date | null | undefined): string {
		if (!date) return 'Nikdy';
		const d = new Date(date);
		return d.toLocaleString('cs-CZ', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function handleOpenChange(newOpen: boolean) {
		if (!newOpen) {
			sessions = null;
			error = '';
			successMessage = '';
		}
		open = newOpen;
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Přihlašovací relace</Dialog.Title>
			<Dialog.Description>
				Správa přihlašovacích relací uživatele {user?.username ?? ''}.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			{#if isLoading}
				<div class="flex items-center justify-center py-8">
					<p class="text-gray-500">Načítání...</p>
				</div>
			{:else if sessions}
				<div class="space-y-4">
					<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
						<dl class="space-y-3">
							<div class="flex justify-between">
								<dt class="text-sm font-medium text-gray-600">Poslední přihlášení:</dt>
								<dd class="text-sm text-gray-900">{formatDate(sessions.lastLogin)}</dd>
							</div>
							<div class="flex justify-between">
								<dt class="text-sm font-medium text-gray-600">Aktivní relace:</dt>
								<dd class="text-sm text-gray-900">
									<span
										class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold {sessions.activeSessionCount > 0
											? 'bg-green-100 text-green-800'
											: 'bg-gray-100 text-gray-800'}"
									>
										{sessions.activeSessionCount}
									</span>
								</dd>
							</div>
							<div class="flex justify-between">
								<dt class="text-sm font-medium text-gray-600">Stav:</dt>
								<dd class="text-sm">
									{#if sessions.hasActiveSession}
										<span class="inline-flex items-center gap-1 text-green-600">
											<span class="h-2 w-2 rounded-full bg-green-500"></span>
											Přihlášen
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 text-gray-500">
											<span class="h-2 w-2 rounded-full bg-gray-400"></span>
											Nepřihlášen
										</span>
									{/if}
								</dd>
							</div>
						</dl>
					</div>

					{#if sessions.activeSessionCount > 0}
						<div class="rounded-lg border border-orange-200 bg-orange-50 p-4">
							<p class="text-sm text-orange-800">
								Uživatel má {sessions.activeSessionCount} aktivní{sessions.activeSessionCount === 1 ? '' : 'ch'} relaci{sessions.activeSessionCount === 1 ? '' : 'í'}.
								Ukončením všech relací bude uživatel odhlášen ze všech zařízení.
							</p>
						</div>
					{/if}
				</div>
			{/if}

			{#if error}
				<div class="rounded-md bg-red-50 p-3 text-sm text-red-600">
					{error}
				</div>
			{/if}

			{#if successMessage}
				<div class="rounded-md bg-green-50 p-3 text-sm text-green-600">
					{successMessage}
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<button
				type="button"
				class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-800 hover:bg-gray-100"
				onclick={() => (open = false)}
			>
				Zavřít
			</button>
			{#if sessions && sessions.activeSessionCount > 0}
				<button
					type="button"
					class="rounded-md bg-orange-500 px-3 py-1.5 text-white hover:bg-orange-600 disabled:bg-orange-300"
					onclick={handleExpireTokens}
					disabled={isExpiring}
				>
					{isExpiring ? 'Ukončuji...' : 'Ukončit všechny relace'}
				</button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

