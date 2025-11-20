<script lang="ts">
	import { resolveAny } from '$lib/utils/resolveAny';

	interface Props {
		symbol: string;
		correctSymbol?: boolean;
		interactable?: boolean;
		colorOnClick?: boolean;
		onClick?: () => void;
	}

	let selected = $state<boolean>(false);

	let {
		symbol,
		correctSymbol = false,
		interactable = true,
		colorOnClick = true,
		onClick = () => onSymbolClick(correctSymbol)
	}: Props = $props();

	function onSymbolClick(correct: boolean) {
		selected = true;

		const audio = new Audio(
			resolveAny(correct ? '/sound/symbolCorrect.ogg' : '/sound/symbolMistake.ogg')
		);
		audio.play();
	}
</script>

<div>
	<button type="button" class="symbol font-serif text-4xl text-gray-800"
					class:correct-symbol={correctSymbol}
					class:incorrect-symbol={!correctSymbol}
					class:non-interactable={!interactable}
					class:selected={selected && colorOnClick}
					onclick={onClick}
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
					&.correct-symbol{
              color: #1E40AF;
              &::before {
                  background-color: #bbc5e7;
                  z-index: -1;
              }
					}

					&.incorrect-symbol{
							color: #DC2626;
							&::before {
									background-color: #f4bdbd;
									z-index: -2;
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
</style>

