<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { setUserRole } from '$lib/api/user-management';
	import { UserRole, type UserDTO } from '$lib/types/api.types';

	let {
		open = $bindable(false),
		user,
		onSuccess
	}: {
		open?: boolean;
		user: UserDTO | null;
		onSuccess?: () => void;
	} = $props();

	let selectedRole = $state<UserRole>(UserRole.Student);
	let isSubmitting = $state(false);
	let error = $state('');

	$effect(() => {
		if (user && open) {
			selectedRole = user.role;
			error = '';
		}
	});

	async function handleSubmit() {
		if (!user) return;
		error = '';

		if (selectedRole === user.role) {
			open = false;
			return;
		}

		isSubmitting = true;
		try {
			await setUserRole(user.id, selectedRole);
			open = false;
			onSuccess?.();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se změnit roli';
		} finally {
			isSubmitting = false;
		}
	}

	function handleOpenChange(newOpen: boolean) {
		if (!newOpen) {
			error = '';
		}
		open = newOpen;
	}

	function getRoleName(role: UserRole): string {
		switch (role) {
			case UserRole.Garant: return 'Garant';
			case UserRole.Lector: return 'Lektor';
			case UserRole.Student: return 'Student';
			default: return role;
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<Dialog.Title>Změnit roli</Dialog.Title>
			<Dialog.Description>
				Změna role pro uživatele {user?.username ?? ''}.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<label for="roleSelect" class="text-sm font-medium text-gray-700">Současná role:</label>
				<p class="text-sm text-gray-600">{user ? getRoleName(user.role) : '-'}</p>
			</div>

			<div class="space-y-2">
				<label for="roleSelect" class="text-sm font-medium text-gray-700">Nová role:</label>
				<select
					id="roleSelect"
					bind:value={selectedRole}
					class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
				>
					<option value={UserRole.Student}>Student</option>
					<option value={UserRole.Lector}>Lektor</option>
					<option value={UserRole.Garant}>Garant</option>
				</select>
			</div>

			{#if error}
				<div class="rounded-md bg-red-50 p-3 text-sm text-red-600">
					{error}
				</div>
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
				disabled={isSubmitting}
			>
				{isSubmitting ? 'Ukládám...' : 'Uložit'}
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
