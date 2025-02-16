<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	interface Props {
		isHighlighted?: boolean;
		isDeHighlighted?: boolean;
		word: string;
		id: string;
		registerElement?: (element: HTMLElement) => void;
		unregisterElement?: (element: HTMLElement) => void;
	}

	let {
		isHighlighted = false,
		isDeHighlighted = false,
		word,
		id,
		registerElement = () => {},
		unregisterElement = () => {}
	}: Props = $props();

	let element = $state<HTMLElement>();

	onMount(() => {
		element && registerElement(element);
	});

	onDestroy(() => {
		element && unregisterElement(element);
	});
</script>

<div
	{id}
	bind:this={element}
	class="inline-flex h-24 items-center justify-center rounded-md font-serif text-[30px] {isHighlighted
		? 'text-green-500'
		: isDeHighlighted
			? 'text-gray-400'
			: 'text-gray-700'}"
>
	{word}
</div>
