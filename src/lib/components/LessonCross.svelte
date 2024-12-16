<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onDestroy, onMount } from 'svelte';

	interface Props {
		id: string;
		registerElement: (element: HTMLElement) => void;
		unregisterElement: (element: HTMLElement) => void;
	}

	let { id, registerElement, unregisterElement }: Props = $props();

	let element: HTMLElement | undefined = $state();

	onMount(() => {
		if (element) {
			registerElement(element);
		}
	});

	onDestroy(() => {
		if (element) {
			unregisterElement(element);
		}
	});
</script>

<div bind:this={element} {id}>
	<Icon icon="mdi:eye-outline" class="h-24 w-24 text-gray-500" />
</div>
