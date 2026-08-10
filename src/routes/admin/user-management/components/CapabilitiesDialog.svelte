<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { getUserCapabilities, setUserCapabilities } from '$lib/api/user-management';
	import {
		CAPABILITIES,
		capabilityLabels,
		roleLabels,
		type Capability,
		type UserDTO
	} from '$lib/types/api.types';

	let {
		open = $bindable(false),
		user,
		onSuccess
	}: {
		open?: boolean;
		user: UserDTO | null;
		onSuccess?: () => void;
	} = $props();

	let roleCapabilities = $state<Capability[]>([]);
	let checked = $state<Record<string, boolean>>({});
	let isLoading = $state(false);
	let isSubmitting = $state(false);
	let error = $state('');

	$effect(() => {
		if (user && open) {
			loadCapabilities(user.id);
		}
	});

	async function loadCapabilities(uuid: string) {
		isLoading = true;
		error = '';
		try {
			const response = await getUserCapabilities(uuid);
			roleCapabilities = response.roleCapabilities;
			const next: Record<string, boolean> = {};
			for (const cap of CAPABILITIES) {
				next[cap] =
					response.roleCapabilities.includes(cap) || response.extraCapabilities.includes(cap);
			}
			checked = next;
		} catch {
			error = 'Nepodařilo se načíst oprávnění';
		} finally {
			isLoading = false;
		}
	}

	async function handleSubmit() {
		if (!user) return;
		error = '';
		isSubmitting = true;
		try {
			const extras = CAPABILITIES.filter((cap) => checked[cap] && !roleCapabilities.includes(cap));
			await setUserCapabilities(user.id, extras);
			open = false;
			onSuccess?.();
		} catch {
			error = 'Nepodařilo se uložit oprávnění';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Oprávnění</Dialog.Title>
			<Dialog.Description>
				Uživatel {user?.username ?? ''} má základní oprávnění z role
				{user ? roleLabels[user.role] : ''}. Zde můžete přidat další.
			</Dialog.Description>
		</Dialog.Header>

		<div class="max-h-96 space-y-1 overflow-y-auto py-4">
			{#if isLoading}
				<p class="py-6 text-center text-sm text-gray-500">Načítání…</p>
			{:else}
				{#each CAPABILITIES as cap (cap)}
					{@const fromRole = roleCapabilities.includes(cap)}
					<label
						class="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50 {fromRole
							? 'opacity-60'
							: ''}"
					>
						<input
							type="checkbox"
							bind:checked={checked[cap]}
							disabled={fromRole}
							class="h-4 w-4 rounded border-gray-300 text-blue-600"
						/>
						<span class="flex-1 text-sm text-gray-800">{capabilityLabels[cap]}</span>
						{#if fromRole}
							<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">z role</span>
						{/if}
					</label>
				{/each}
			{/if}

			{#if error}
				<div class="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
			{/if}
		</div>

		<Dialog.Footer>
			<button
				type="button"
				class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-800 hover:bg-gray-100"
				onclick={() => (open = false)}
			>
				Zrušit
			</button>
			<button
				type="button"
				class="rounded-md bg-blue-500 px-3 py-1.5 text-white hover:bg-blue-600 disabled:bg-blue-300"
				onclick={handleSubmit}
				disabled={isSubmitting || isLoading}
			>
				{isSubmitting ? 'Ukládám…' : 'Uložit'}
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
