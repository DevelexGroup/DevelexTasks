<script lang="ts">
	export let href: string;
</script>

<a
	on:click
	class="rounded bg-orange-500 px-4 py-2 font-bold text-white no-underline hover:bg-orange-700"
	{href}
>
	<slot></slot>
</a>
