<script lang="ts">
	import { resolveAny } from '$lib/utils/resolveAny';
	import GazeArea from '$lib/components/common/GazeArea.svelte';
	import { playSound, playSoundOrTTS } from '$lib/utils/sound';
	import { getWordAudioSource } from '$lib/utils/trackLevelUtils';

	interface Props {
		symbol?: string;
		index?: number;
		basePath?: string;
		extension?: string;
		wordToRead?: string | null;
		validateSymbolClick?: (symbol: string, index: number) => boolean;
		interactable?: boolean;
		letterSpacing?: number;
		width?: number;
		height?: number;
	}

	let isCorrect = $state<boolean>(false);
	let isSelected = $state<boolean>(false);

	let {
		symbol = '',
		index = -1,
		basePath = '/images',
		extension = 'png',
		wordToRead = null,
		validateSymbolClick = () => true,
		interactable = true,
		letterSpacing = 0,
		width = 20,
		height = width
	}: Props = $props();

	function onSymbolClick(): void {
		if (wordToRead) {
			playSoundOrTTS(getWordAudioSource(wordToRead), wordToRead, 'cs-CZ');
		}

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
	<button
		type="button"
		class="symbol symbol--image cursor-pointer font-serif text-4xl text-gray-800"
		style="letter-spacing: {letterSpacing}px; width: {width * 0.25}rem; height: {height * 0.25}rem;"
		class:correct-symbol={isCorrect}
		class:incorrect-symbol={!isCorrect}
		class:non-interactable={!interactable}
		class:selected={isSelected}
		onclick={onSymbolClick}
	>
		<img
			class="h-full w-full object-contain"
			src={resolveAny(`${basePath}/${symbol}.${extension}`)}
			alt={symbol}
		/>
	</button>
</GazeArea>

<style>
	.symbol {
		cursor: pointer;
		position: relative;
		user-select: none;

		&.non-interactable {
			pointer-events: none;
		}

		&.selected {
			&.correct-symbol {
				color: #15803d;
				&::before {
					animation: correct-flash-bg 1000ms ease-in-out;
				}
			}

			&.incorrect-symbol {
				--animation-time: 300ms;
				animation: incorrect-flash-text var(--animation-time) ease-in-out 2;
				&::before {
					animation: incorrect-flash-bg var(--animation-time) ease-in-out 2;
				}
			}
		}

		&::before {
			content: '';
			position: absolute;
			inset: -0.375rem;
			border-radius: 0.5rem;
			background-color: rgba(0, 0, 0, 0);
			transition: all 200ms ease-in;
			pointer-events: none;
			z-index: -2;
		}

		img {
			position: relative;
			z-index: 1;
		}
	}

	@keyframes incorrect-flash-text {
		0%,
		100% {
			color: inherit;
		}

		50% {
			color: #dc2626;
		}
	}

	@keyframes incorrect-flash-bg {
		0%,
		100% {
			background-color: rgba(0, 0, 0, 0);
			z-index: auto;
		}

		50% {
			background-color: #f4bdbd;
		}
	}

	@keyframes correct-flash-bg {
		0%,
		100% {
			background-color: rgba(0, 0, 0, 0);
			z-index: auto;
		}

		33%,
		66% {
			background-color: #bfe5cc;
		}
	}
</style>
