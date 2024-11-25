<script lang="ts">
	import { createBubbler } from 'svelte/legacy';

	const bubble = createBubbler();
	interface Props {
		href: string;
		children?: import('svelte').Snippet;
	}

	let { href, children }: Props = $props();
</script>

<a
	onclick={bubble('click')}
	class="rounded bg-orange-500 px-4 py-2 font-bold text-white no-underline hover:bg-orange-700"
	{href}
>
	{@render children?.()}
</a>
