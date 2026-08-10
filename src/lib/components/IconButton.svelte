<script lang="ts">
	import Icon from '@iconify/svelte';

	interface Props {
		icon: string;
		label: string;
		onclick: (event: MouseEvent) => void;
		variant?: 'neutral' | 'primary' | 'success' | 'danger';
		size?: 'sm' | 'md';
	}

	let { icon, label, onclick, variant = 'neutral', size = 'md' }: Props = $props();

	const variants = {
		neutral: 'text-gray-500 hover:bg-gray-200 hover:text-gray-700',
		primary: 'text-blue-600 hover:bg-blue-100',
		success: 'text-green-600 hover:bg-green-100',
		danger: 'text-red-600 hover:bg-red-100'
	};

	const sizes = {
		sm: 'h-8 w-8',
		md: 'h-9 w-9'
	};
</script>

<span class="group relative inline-flex">
	<button
		type="button"
		aria-label={label}
		class="inline-flex items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none {sizes[
			size
		]} {variants[variant]}"
		{onclick}
	>
		<Icon {icon} class="h-5 w-5" />
	</button>
	<span
		role="tooltip"
		class="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
	>
		{label}
	</span>
</span>
