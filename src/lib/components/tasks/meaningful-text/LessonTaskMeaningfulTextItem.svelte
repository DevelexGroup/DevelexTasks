<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	interface Props {
		word: string;
		id: string;
		registerElement: (element: HTMLElement) => void;
		unregisterElement: (element: HTMLElement) => void;
	}

	let { word, id, registerElement, unregisterElement }: Props = $props();
	let element = $state<HTMLElement>();

	onMount(() => {
		element && registerElement(element);
	});

	onDestroy(() => {
		element && unregisterElement(element);
	});
</script>

<span
	{id}
	bind:this={element}
	class="text-[23px] text-black"
	style="font-family: 'Times New Roman'"
>
	{word}
</span>
