<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { updateUser, resetPassword } from '$lib/api/user-management';
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

	let username = $state('');
	let email = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let changePassword = $state(false);
	let isSubmitting = $state(false);
	let error = $state('');

	$effect(() => {
		if (user && open) {
			username = user.username;
			email = user.email;
			firstName = user.firstName;
			lastName = user.lastName;
			newPassword = '';
			confirmPassword = '';
			changePassword = false;
			error = '';
		}
	});

	function resetForm() {
		username = '';
		email = '';
		firstName = '';
		lastName = '';
		newPassword = '';
		confirmPassword = '';
		changePassword = false;
		error = '';
	}

	async function handleSubmit() {
		if (!user) return;
		error = '';

		if (!username || !firstName || !lastName) {
			error = 'Vyplňte všechna povinná pole';
			return;
		}

		if (changePassword) {
			if (!newPassword) {
				error = 'Zadejte nové heslo';
				return;
			}
			if (newPassword !== confirmPassword) {
				error = 'Hesla se neshodují';
				return;
			}
			if (newPassword.length < 6) {
				error = 'Heslo musí mít alespoň 6 znaků';
				return;
			}
		}

		isSubmitting = true;
		try {
			// Update user info
			await updateUser(user.id, {
				firstName,
				lastName,
				email
			});

			// Reset password if requested
			if (changePassword && newPassword) {
				await resetPassword(user.id, newPassword);
			}

			resetForm();
			open = false;
			onSuccess?.();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se upravit uživatele';
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

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Upravit uživatele</Dialog.Title>
			<Dialog.Description>
				Upravte údaje uživatele {user?.username ?? ''}.
			</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4 py-4">
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<label for="editFirstName" class="text-sm font-medium text-gray-700">Jméno:</label>
					<input
						id="editFirstName"
						type="text"
						bind:value={firstName}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
					/>
				</div>
				<div class="space-y-2">
					<label for="editLastName" class="text-sm font-medium text-gray-700">Příjmení:</label>
					<input
						id="editLastName"
						type="text"
						bind:value={lastName}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
					/>
				</div>
			</div>

			<div class="space-y-2">
				<label for="editUsername" class="text-sm font-medium text-gray-700">Uživatelské jméno:</label>
				<input
					id="editUsername"
					type="text"
					bind:value={username}
					disabled
					class="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500 cursor-not-allowed"
				/>
				<p class="text-xs text-gray-500">Uživatelské jméno nelze změnit</p>
			</div>

			<div class="space-y-2">
				<label for="editEmail" class="text-sm font-medium text-gray-700">E-mail (volitelné):</label>
				<input
					id="editEmail"
					type="email"
					bind:value={email}
					class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
				/>
			</div>

			<div class="border-t pt-4">
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={changePassword}
						class="h-4 w-4 rounded border-gray-300 text-blue-600"
					/>
					<span class="text-sm font-medium text-gray-700">Změnit heslo</span>
				</label>
			</div>

			{#if changePassword}
				<div class="space-y-4 pl-6 border-l-2 border-blue-200">
					<div class="space-y-2">
						<label for="editNewPassword" class="text-sm font-medium text-gray-700">Nové heslo:</label>
						<input
							id="editNewPassword"
							type="password"
							bind:value={newPassword}
							class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
							placeholder="••••••••"
						/>
					</div>
					<div class="space-y-2">
						<label for="editConfirmPassword" class="text-sm font-medium text-gray-700">Potvrzení hesla:</label>
						<input
							id="editConfirmPassword"
							type="password"
							bind:value={confirmPassword}
							class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
							placeholder="••••••••"
						/>
					</div>
				</div>
			{/if}

			{#if error}
				<div class="rounded-md bg-red-50 p-3 text-sm text-red-600">
					{error}
				</div>
			{/if}
		</form>

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
				disabled={isSubmitting}
			>
				{isSubmitting ? 'Ukládám...' : 'Uložit'}
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
