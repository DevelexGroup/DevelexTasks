<script lang="ts">
	import { resolveAny } from '$lib/utils/resolveAny';
	import { playSound, SOUND_CORRECT, SOUND_MISTAKE } from '$lib/utils/sound';

	interface Props {
		symbol?: string;
		index?: number;
		validateSymbolClick?: (symbol: string, index: number) => boolean;
		interactable?: boolean;
	}

	let isCorrect = $state<boolean>(false);
	let isSelected = $state<boolean>(false);

	let {
		symbol = '',
		index = -1,
		validateSymbolClick = () => false,
		interactable = true,
	}: Props = $props();

	function onSymbolClick(): void {
		let validationResult = validateSymbolClick(symbol, index);

		if (!isCorrect) {
			isSelected = false;
			setTimeout(() => {
				isSelected = true;
			}, 10);
		}

		playSound(validationResult ? SOUND_CORRECT : SOUND_MISTAKE, 0.33);

		isCorrect = isCorrect || validationResult;
	}
</script>

<div>
	<button type="button" class="symbol font-serif text-4xl text-gray-800"
					class:correct-symbol={isCorrect}
					class:incorrect-symbol={!isCorrect}
					class:non-interactable={!interactable}
					class:selected={isSelected}
					onclick={onSymbolClick}
	>
		<span>{symbol}</span>
	</button>
</div>

<style>
	.symbol {
		cursor: pointer;
		position: relative;
		user-select: none;
		letter-spacing: 4px;

		&.non-interactable{
				pointer-events: none;
		}

		&.selected{
			&.correct-symbol {
				color: #15803D;
				&::before {
					animation: correct-flash-bg 1000ms ease-in-out;
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
      z-index: -2;
		}

		span {
			position: relative;
			z-index: 1;
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
		}
	}

	@keyframes correct-flash-bg {
		0%, 100% {
			background-color: rgba(0, 0, 0, 0);
			z-index: auto;
		}

		33%, 66% {
			background-color: #bfe5cc;
		}
	}
</style>
