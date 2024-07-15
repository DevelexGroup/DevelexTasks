<script lang="ts">
	import { goto } from '$app/navigation';
	import { setConfigWindowFields } from '$lib/stores/gazeConfig';

	export let href: string;

	const processClick = (event: MouseEvent) => {
		setConfigWindowFields(event, window);
		goto(href);
	};
</script>

<button
	on:click={processClick}
	class="rounded bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-700"
>
	<slot></slot>
</button>
