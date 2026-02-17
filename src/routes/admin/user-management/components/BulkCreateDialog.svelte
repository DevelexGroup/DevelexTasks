<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { createUser } from '$lib/api/user-management';
	import { UserRole } from '$lib/types/api.types';

	interface GeneratedUser {
		username: string;
		password: string;
		email: string;
		firstName: string;
		lastName: string;
		role: UserRole;
	}

	let {
		open = $bindable(false),
		onSuccess
	}: {
		open?: boolean;
		onSuccess?: () => void;
	} = $props();

	let count = $state(5);
	let role = $state<UserRole>(UserRole.Student);
	let usernamePrefix = $state('user');
	let generatedUsers = $state<GeneratedUser[]>([]);
	let isGenerating = $state(false);
	let isCreating = $state(false);
	let error = $state('');
	let createdCount = $state(0);

	const adjectives = ['Rychlý', 'Chytrý', 'Veselý', 'Odvážný', 'Šikovný', 'Pilný', 'Moudrý', 'Hravý'];
	const nouns = ['Ježek', 'Medvěd', 'Liška', 'Orel', 'Vlk', 'Bobr', 'Kočka', 'Zajíc'];

	function generateRandomPassword(length: number = 12): string {
		const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let result = '';
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}

	function generateRandomUsername(index: number): string {
		const timestamp = Date.now().toString(36).slice(-4);
		return `${usernamePrefix}_${index + 1}_${timestamp}`;
	}

	function generateRandomName(): { firstName: string; lastName: string } {
		const firstName = adjectives[Math.floor(Math.random() * adjectives.length)];
		const lastName = nouns[Math.floor(Math.random() * nouns.length)];
		return { firstName, lastName };
	}

	function generateUsers() {
		generatedUsers = [];
		for (let i = 0; i < count; i++) {
			const username = generateRandomUsername(i);
			const { firstName, lastName } = generateRandomName();
			generatedUsers.push({
				username,
				password: generateRandomPassword(),
				email: `${username}@generated.local`,
				firstName,
				lastName,
				role
			});
		}
	}

	async function createAllUsers() {
		if (generatedUsers.length === 0) {
			error = 'Nejprve vygenerujte uživatele';
			return;
		}

		isCreating = true;
		error = '';
		createdCount = 0;

		try {
			for (const user of generatedUsers) {
				await createUser({
					username: user.username,
					password: user.password,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					userRole: user.role
				});
				createdCount++;
			}
			onSuccess?.();
		} catch (err) {
			error = `Vytvořeno ${createdCount} z ${generatedUsers.length}. Chyba: ${err instanceof Error ? err.message : 'Neznámá chyba'}`;
		} finally {
			isCreating = false;
		}
	}

	function exportToCsv() {
		if (generatedUsers.length === 0) {
			error = 'Nejprve vygenerujte uživatele';
			return;
		}

		const headers = ['username', 'password', 'email', 'firstName', 'lastName', 'role'];
		const rows = generatedUsers.map(u => [
			u.username,
			u.password,
			u.email,
			u.firstName,
			u.lastName,
			u.role
		]);

		const csvContent = [
			headers.join(','),
			...rows.map(row => row.map(cell => `"${cell}"`).join(','))
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `generated_users_${new Date().toISOString().slice(0, 10)}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}

	function resetForm() {
		count = 5;
		role = UserRole.Student;
		usernamePrefix = 'user';
		generatedUsers = [];
		error = '';
		createdCount = 0;
	}

	function handleOpenChange(newOpen: boolean) {
		if (!newOpen) {
			resetForm();
		}
		open = newOpen;
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Hromadné vytvoření uživatelů</Dialog.Title>
			<Dialog.Description>
				Vygenerujte více uživatelů najednou s náhodnými údaji.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<div class="grid grid-cols-3 gap-4">
				<div class="space-y-2">
					<label for="count" class="text-sm font-medium text-gray-700">Počet:</label>
					<input
						id="count"
						type="number"
						min="1"
						max="50"
						bind:value={count}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
					/>
				</div>
				<div class="space-y-2">
					<label for="prefix" class="text-sm font-medium text-gray-700">Prefix:</label>
					<input
						id="prefix"
						type="text"
						bind:value={usernamePrefix}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
						placeholder="user"
					/>
				</div>
				<div class="space-y-2">
					<label for="bulkRole" class="text-sm font-medium text-gray-700">Role:</label>
					<select
						id="bulkRole"
						bind:value={role}
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800"
					>
						<option value={UserRole.Student}>Student</option>
						<option value={UserRole.Lector}>Lektor</option>
						<option value={UserRole.Garant}>Garant</option>
					</select>
				</div>
			</div>

			<button
				type="button"
				class="rounded-md bg-gray-500 px-3 py-1.5 text-white hover:bg-gray-600"
				onclick={generateUsers}
				disabled={isGenerating}
			>
				Vygenerovat náhled
			</button>

			{#if generatedUsers.length > 0}
				<div class="max-h-64 overflow-auto rounded-md border border-gray-200">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="sticky top-0 bg-gray-50">
							<tr>
								<th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Username</th>
								<th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Heslo</th>
								<th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Jméno</th>
								<th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Role</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white">
							{#each generatedUsers as user, i (i)}
								<tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
									<td class="px-4 py-2 text-sm text-gray-900">{user.username}</td>
									<td class="px-4 py-2 font-mono text-sm text-gray-900">{user.password}</td>
									<td class="px-4 py-2 text-sm text-gray-900">{user.firstName} {user.lastName}</td>
									<td class="px-4 py-2 text-sm text-gray-900">{user.role}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

			{#if error}
				<div class="rounded-md bg-red-50 p-3 text-sm text-red-600">
					{error}
				</div>
			{/if}

			{#if isCreating}
				<div class="rounded-md bg-blue-50 p-3 text-sm text-blue-600">
					Vytvářím uživatele... ({createdCount}/{generatedUsers.length})
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
			<button
				type="button"
				class="rounded-md bg-green-500 px-3 py-1.5 text-white hover:bg-green-600 disabled:bg-green-300"
				onclick={exportToCsv}
				disabled={generatedUsers.length === 0}
			>
				Exportovat CSV
			</button>
			<button
				type="button"
				class="rounded-md bg-blue-500 px-3 py-1.5 text-white hover:bg-blue-600 disabled:bg-blue-300"
				onclick={createAllUsers}
				disabled={generatedUsers.length === 0 || isCreating}
			>
				{isCreating ? 'Vytvářím...' : 'Vytvořit všechny'}
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
