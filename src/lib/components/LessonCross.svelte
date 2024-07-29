<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onDestroy, onMount } from 'svelte';

	export let id: string;
	export let registerElement: (element: HTMLElement) => void;
	export let unregisterElement: (element: HTMLElement) => void;

	let element: HTMLElement;

	onMount(() => {
		registerElement(element);
	});

	onDestroy(() => {
		unregisterElement(element);
	});
</script>

<div bind:this={element} {id}>
	<Icon icon="mdi:eye-outline" class="h-24 w-24 text-gray-500" />
</div>
