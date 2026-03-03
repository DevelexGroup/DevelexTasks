<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { createUser } from '$lib/api/user-management';
	import { UserRole } from '$lib/types/api.types';

	let {
		open = $bindable(false),
		onSuccess
	}: {
		open?: boolean;
		onSuccess?: () => void;
	} = $props();

	let username = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let role = $state<UserRole>(UserRole.Student);
	let isSubmitting = $state(false);
	let error = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);

	function resetForm() {
		username = '';
		email = '';
		password = '';
		confirmPassword = '';
		firstName = '';
		lastName = '';
		role = UserRole.Student;
		error = '';
	}

	async function handleSubmit() {
		error = '';

		if (!username || !password || !firstName || !lastName) {
			error = 'Vyplňte všechna povinná pole';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Hesla se neshodují';
			return;
		}

		if (password.length < 6) {
			error = 'Heslo musí mít alespoň 6 znaků';
			return;
		}

		isSubmitting = true;
		try {
			await createUser({
				username,
				email,
				password,
				firstName,
				lastName,
				userRole: role
			});
			resetForm();
			open = false;
			onSuccess?.();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepodařilo se vytvořit uživatele';
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
			<Dialog.Title>Vytvořit uživatele</Dialog.Title>
			<Dialog.Description>
				Vyplňte údaje pro vytvoření nového uživatele.
			</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4 py-4">
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<label for="firstName" class="text-sm font-medium text-gray-700">Jméno:</label>
					<input
						id="firstName"
						type="text"
						bind:value={firstName}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
						placeholder="Jan"
					/>
				</div>
				<div class="space-y-2">
					<label for="lastName" class="text-sm font-medium text-gray-700">Příjmení:</label>
					<input
						id="lastName"
						type="text"
						bind:value={lastName}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
						placeholder="Novák"
					/>
				</div>
			</div>

			<div class="space-y-2">
				<label for="username" class="text-sm font-medium text-gray-700">Uživatelské jméno:</label>
				<input
					id="username"
					type="text"
					bind:value={username}
					class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
					placeholder="jan.novak"
				/>
			</div>

			<div class="space-y-2">
				<label for="email" class="text-sm font-medium text-gray-700">E-mail (volitelné):</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
					placeholder="jan.novak@example.com"
				/>
			</div>

			<div class="space-y-2">
				<label for="role" class="text-sm font-medium text-gray-700">Role:</label>
				<select
					id="role"
					bind:value={role}
					class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
				>
					<option value={UserRole.Student}>Student</option>
					<option value={UserRole.Lector}>Lektor</option>
					<option value={UserRole.Garant}>Garant</option>
				</select>
			</div>

			<div class="space-y-2">
				<label for="password" class="text-sm font-medium text-gray-700">Heslo:</label>
				<div class="relative">
					<input
						id="password"
						type={showPassword ? 'text' : 'password'}
						bind:value={password}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-800"
						placeholder="••••••••"
					/>
					<button
						type="button"
						onclick={() => (showPassword = !showPassword)}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
						aria-label={showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
					>
						{#if showPassword}
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
								<line x1="1" y1="1" x2="23" y2="23"/>
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
								<circle cx="12" cy="12" r="3"/>
							</svg>
						{/if}
					</button>
				</div>
			</div>

			<div class="space-y-2">
				<label for="confirmPassword" class="text-sm font-medium text-gray-700">Potvrzení hesla:</label>
				<div class="relative">
					<input
						id="confirmPassword"
						type={showConfirmPassword ? 'text' : 'password'}
						bind:value={confirmPassword}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-800"
						placeholder="••••••••"
					/>
					<button
						type="button"
						onclick={() => (showConfirmPassword = !showConfirmPassword)}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
						aria-label={showConfirmPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
					>
						{#if showConfirmPassword}
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
								<line x1="1" y1="1" x2="23" y2="23"/>
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
								<circle cx="12" cy="12" r="3"/>
							</svg>
						{/if}
					</button>
				</div>
			</div>

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
				{isSubmitting ? 'Vytváření...' : 'Vytvořit'}
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
