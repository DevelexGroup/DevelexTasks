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
