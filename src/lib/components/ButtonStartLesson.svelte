<script lang="ts">
	import { goto } from '$app/navigation';
	import { setConfigWindowFields } from '$lib/stores/gazeConfig';

	interface Props {
		href: string;
		children?: import('svelte').Snippet;
	}

	let { href, children }: Props = $props();

	const processClick = (event: MouseEvent) => {
		setConfigWindowFields(event, window);
		goto(href);
	};
</script>

<button
	onclick={processClick}
	class="rounded bg-orange-500 px-4 py-2 text-left font-bold text-white hover:bg-orange-700"
>
	{@render children?.()}
</button>
