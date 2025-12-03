<script lang="ts">
	import { userStore } from '$lib/stores/user';

	const userName = $derived($userStore?.id?.trim() || 'Unknown user');
	const initials = $derived(userName.charAt(0).toUpperCase());

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

<button type="button" class="group flex items-center rounded-lg transition-colors px-4 py-3 gap-4 absolute bottom-4 left-4 select-none">
	<span class="group__icon flex h-10 w-10 items-center justify-center rounded-full {colorScheme.bg} text-base font-bold {colorScheme.text} shadow-md ring-2 ring-white/20 transition-transform duration-200 group-hover:scale-110 group-hover:ring-4 group-hover:{colorScheme.ring}">
		{initials}
	</span>
	<span class="group__text text-base font-semibold text-foreground">{userName}</span>
</button>

<style>
	.group {
		background: transparent;

		.group__icon {
			flex-shrink: 0;
		}

		&:hover {
			background: rgba(0, 0, 0, 0.1);
      .group__icon {
        transform: scale(1.05);
      }
		}
	}
</style>