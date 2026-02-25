<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { deleteUser } from '$lib/api/user-management';
	import type { UserDTO } from '$lib/types/api.types';

	let {
		open = $bindable(false),
		user,
		onSuccess
	}: {
		open?: boolean;
		user: UserDTO | null;
		onSuccess?: () => void;
	} = $props();

	let confirmUsername = $state('');
	let isSubmitting = $state(false);
	let error = $state('');

	$effect(() => {
		if (open) {
			confirmUsername = '';
			error = '';
		}
	});

	function resetForm() {
		confirmUsername = '';
		error = '';
	}

	async function handleSubmit() {
		if (!user) return;
		error = '';

		if (confirmUsername !== user.username) {
			error = 'Zadané uživatelské jméno se neshoduje';
			return;
		}

		isSubmitting = true;
		try {
			await deleteUser(user.id);
			resetForm();
			open = false;
			onSuccess?.();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se smazat uživatele';
		} finally {
			isSubmitting = false;
		}
	}

	function handleOpenChange(newOpen: boolean) {
		if (!newOpen) {
			resetForm();
		}
		open = newOpen;
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>Smazat uživatele</Dialog.Title>
			<Dialog.Description>
				Tato akce je nevratná. Pro potvrzení zadejte uživatelské jméno.
			</Dialog.Description>
		</Dialog.Header>

		{#if user}
			<div class="space-y-4 py-4">
				<!-- User info -->
				<div class="rounded-lg bg-red-50 p-4 border border-red-200">
					<p class="text-sm font-medium text-red-800 mb-2">
						Chystáte se smazat následujícího uživatele:
					</p>
					<div class="space-y-1 text-sm text-red-700">
						<p><span class="font-semibold">Jméno:</span> {user.firstName} {user.lastName}</p>
						<p><span class="font-semibold">Uživatelské jméno:</span> {user.username}</p>
						<p><span class="font-semibold">E-mail:</span> {user.email || 'Žádný email'}</p>
					</div>
				</div>

				<!-- Confirmation input -->
				<div class="space-y-2">
					<label for="confirmUsername" class="block text-sm font-medium text-gray-700">
						Zadejte uživatelské jméno "<span class="font-bold">{user.username}</span>" pro potvrzení:
					</label>
					<input
						id="confirmUsername"
						type="text"
						bind:value={confirmUsername}
						placeholder={user.username}
						class="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
						disabled={isSubmitting}
					/>
				</div>

				{#if error}
					<div class="rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
						{error}
					</div>
				{/if}
			</div>

			<Dialog.Footer>
				<button
					type="button"
					class="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 disabled:opacity-50"
					onclick={() => (open = false)}
					disabled={isSubmitting}
				>
					Zrušit
				</button>
				<button
					type="button"
					class="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
					onclick={handleSubmit}
					disabled={isSubmitting || confirmUsername !== user.username}
				>
					{isSubmitting ? 'Mazání...' : 'Smazat uživatele'}
				</button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
