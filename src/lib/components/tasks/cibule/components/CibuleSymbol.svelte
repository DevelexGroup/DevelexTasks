<script lang="ts">
	interface Props {
		symbol: string;
		interactable?: boolean;
		onClick?: () => void;
	}

	let selected = $state<boolean>(false);

	let {
		symbol,
		interactable = true,
		onClick = () => {
			selected = !selected;
		}
	}: Props = $props();
</script>

<div>
	<button type="button" class="symbol font-serif text-4xl text-gray-800" class:non-interactable={!interactable} class:selected={selected} onclick={onClick}>{symbol}</button>
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
					color: #1E40AF; /* Tailwind's blue-800 */

					&::before {
							background-color: rgba(30, 64, 175, 0.3);
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

			&:hover{
					&::before {
							background-color: rgba(0, 0, 0, 0.3);
							transition: all 200ms ease-out;
          }
			}
	}
</style>

