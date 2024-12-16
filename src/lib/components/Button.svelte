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
	class="rounded bg-[#0071bc] px-4 py-2 font-bold text-white no-underline hover:bg-[#30c0f2]"
	{href}
>
	{@render children?.()}
</a>
