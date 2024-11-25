<script lang="ts">
	import '../app.css';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<main class="flex h-screen w-screen flex-col items-center justify-center">
	{@render children?.()}
</main>
