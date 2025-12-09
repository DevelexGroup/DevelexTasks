<script lang="ts">
	import { resolveAny } from '$lib/utils/resolveAny';
	import GazeArea from '$lib/components/common/GazeArea.svelte';

	interface Props {
		symbol?: string;
		index?: number;
		validateSymbolClick?: (symbol: string, index: number) => boolean;
		interactable?: boolean;
		letterSpacing?: number;
	}

	let isCorrect = $state<boolean>(false);
	let isSelected = $state<boolean>(false);

	let {
		symbol = '',
		index = -1,
		validateSymbolClick = () => true,
		interactable = true,
		letterSpacing = 0
	}: Props = $props();

	function onSymbolClick(): void {
		let validationResult = validateSymbolClick(symbol, index);

		if (!isCorrect) {
			isSelected = false;
			setTimeout(() => {
				isSelected = true;
			}, 10);
		}

		isCorrect = isCorrect || validationResult;
	}
</script>

<GazeArea id="symbol-element-{index}">
	<button type="button" class="symbol symbol--image font-serif text-4xl text-gray-800 h-20 w-20"
					style="letter-spacing: {letterSpacing}px;"
					class:correct-symbol={isCorrect}
					class:incorrect-symbol={!isCorrect}
					class:non-interactable={!interactable}
					class:selected={isSelected}
					onclick={onSymbolClick}
	>
		<img
			class="h-full w-full object-contain"
			src={resolveAny(`/images/tasks/zrakovka/${symbol}.png`)}
			alt={symbol}
		/>
	</button>
</GazeArea>
