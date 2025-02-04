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

	let element: HTMLElement = $state();

	onMount(() => {
		registerElement(element);
	});

	onDestroy(() => {
		unregisterElement(element);
	});
</script>

<div
	{id}
	bind:this={element}
	class="inline-flex h-24 items-center justify-center rounded-md border px-1.5 font-serif text-[30px] {isHighlighted
		? 'border-green-700'
		: isDeHighlighted
			? 'border-gray-400'
			: 'border-transparent'}"
>
	<div class="h-32 w-32">
		<img src={`/src/lib/images/lesson/fonologic/${word}.webp`} alt={word} class="h-full w-full" />
	</div>
</div>
