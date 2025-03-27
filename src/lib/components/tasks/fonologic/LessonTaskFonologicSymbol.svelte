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
	class="inline-flex h-28 items-center justify-center rounded-md border px-1.5 font-serif text-[30px] {isHighlighted
		? 'border-green-700'
		: isDeHighlighted
			? 'border-gray-400'
			: 'border-transparent'}"
>
	<div class="h-36 w-36">
		<img
			src={`/img/lesson/fonologic/${word}.webp`}
			alt={word}
			class="h-full w-full object-contain"
		/>
	</div>
</div>
