<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authUser } from '$lib/stores/auth';
	import { logout } from '$lib/api/auth';
	import { Button } from '$lib/components/ui/button';

	const isLoggedIn = $derived($authUser !== null);
	const userName = $derived(
		isLoggedIn ? `${$authUser!.firstName} ${$authUser!.lastName}` : 'Nepřihlášen'
	);
	const initials = $derived(
		isLoggedIn
			? `${$authUser!.firstName.charAt(0)}${$authUser!.lastName.charAt(0)}`.toUpperCase()
			: '?'
	);

	let loggingOut = $state(false);

	async function handleLogout() {
		loggingOut = true;
		try {
			await logout();
			goto(resolve('/login'));
		} catch (err) {
			console.error('Logout error:', err);
		} finally {
			loggingOut = false;
		}
	}

	// Generate a consistent color based on the username
	function stringToColor(str: string): { bg: string; text: string; ring: string } {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}

		const colors = [
			{ bg: 'bg-blue-500', text: 'text-white', ring: 'ring-blue-300' },
			{ bg: 'bg-purple-500', text: 'text-white', ring: 'ring-purple-300' },
			{ bg: 'bg-pink-500', text: 'text-white', ring: 'ring-pink-300' },
			{ bg: 'bg-rose-500', text: 'text-white', ring: 'ring-rose-300' },
			{ bg: 'bg-orange-500', text: 'text-white', ring: 'ring-orange-300' },
			{ bg: 'bg-amber-500', text: 'text-white', ring: 'ring-amber-300' },
			{ bg: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-300' },
			{ bg: 'bg-teal-500', text: 'text-white', ring: 'ring-teal-300' },
			{ bg: 'bg-cyan-500', text: 'text-white', ring: 'ring-cyan-300' },
			{ bg: 'bg-indigo-500', text: 'text-white', ring: 'ring-indigo-300' },
			{ bg: 'bg-violet-500', text: 'text-white', ring: 'ring-violet-300' },
			{ bg: 'bg-fuchsia-500', text: 'text-white', ring: 'ring-fuchsia-300' }
		];

		return colors[Math.abs(hash) % colors.length];
	}

	const colorScheme = $derived(stringToColor(userName));
</script>

{#if isLoggedIn}
	<div class="flex flex-col items-center gap-3">
		<div class="flex items-center gap-4 rounded-lg px-4 py-3">
			<span
				class="flex h-10 w-10 items-center justify-center rounded-full {colorScheme.bg} text-base font-bold {colorScheme.text} shadow-md ring-2 ring-white/20"
			>
				{initials}
			</span>
			<span class="text-base font-semibold text-foreground">{userName}</span>
		</div>
		<Button
			variant="outline"
			class="rounded-md px-3 py-1.5"
			onclick={handleLogout}
			disabled={loggingOut}
		>
			{loggingOut ? 'Odhlašuji...' : 'Odhlásit se'}
		</Button>
	</div>
{:else}
	<Button
		class="rounded-md bg-blue-500 px-3 py-1.5 text-gray-50 hover:bg-blue-600"
		onclick={() => goto(resolve('/login'))}
	>
		Přihlásit se
	</Button>
{/if}
