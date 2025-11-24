<script lang="ts">
	import { resolveAny } from '$lib/utils/resolveAny';

	interface Props {
		symbol: string;
		index?: number;
		validateSymbolClick?: (symbol: string, index: number) => boolean;
		interactable?: boolean;
		colorOnSelect?: boolean;
	}

	let isCorrect = $state<boolean>(false);
	let isSelected = $state<boolean>(false);

	let {
		symbol,
		index = -1,
		validateSymbolClick = () => false,
		interactable = true,
		colorOnSelect = true,
	}: Props = $props();

	function onSymbolClick(): void {
		let validationResult = validateSymbolClick(symbol, index);

		if (!isCorrect) {
			isSelected = false;
			setTimeout(() => {
				isSelected = true;
			}, 10);
		}

		const audio = new Audio(
			resolveAny(validationResult ? '/sound/correct.mp3' : '/sound/mistake.mp3')
		);
		audio.play();

		isCorrect = isCorrect || validationResult;
	}
</script>

<div>
	<button type="button" class="symbol font-serif text-4xl text-gray-800"
					class:correct-symbol={isCorrect}
					class:incorrect-symbol={!isCorrect}
					class:non-interactable={!interactable}
					class:selected={isSelected && colorOnSelect}
					onclick={onSymbolClick}
	>
		{symbol}
	</button>
</div>

<style>
	.symbol {
		cursor: pointer;
		position: relative;
		user-select: none;

		&.non-interactable{
				pointer-events: none;
		}

		&.selected{
			&.correct-symbol {
				color: #1E40AF;
				&::before {
					background-color: #bbc5e7;
					z-index: -1;
				}
			}

			&.incorrect-symbol{
				--animation-time: 300ms;
				animation: incorrect-flash-text var(--animation-time) ease-in-out 2;
				&::before {
					animation: incorrect-flash-bg var(--animation-time) ease-in-out 2;
				}
			}
		}

		&::before{
			content: "";
			position: absolute;
			inset: -0.375rem;
			border-radius: 0.5rem;
			background-color: rgba(0, 0, 0, 0);
			transition: all 200ms ease-in;
			pointer-events: none;
		}
	}

	@keyframes incorrect-flash-text {
		0%, 100% {
			color: inherit;
		}

		50% {
			color: #DC2626;
		}
	}

	@keyframes incorrect-flash-bg {
		0%, 100% {
			background-color: rgba(0, 0, 0, 0);
			z-index: auto;
		}

		50% {
			background-color: #f4bdbd;
			z-index: -2;
		}
	}
</style>
