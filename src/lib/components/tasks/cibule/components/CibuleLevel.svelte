<script lang="ts">
	import DwellTarget from '$lib/components/dwellTarget/DwellTarget.svelte';
	import { CibuleLevelState, type CibuleTaskProps } from '$lib/components/tasks/cibule/cibule.types';
	import CibuleSymbol from '$lib/components/tasks/cibule/components/CibuleSymbol.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { cursorVisible } from '$lib/stores/cursor';

	let keydownHandler: (e: KeyboardEvent) => void;

	let {
		id,
		data,
		repetitions = 1,
		isPractice = false,
		onCompleted = () => {},
		validateSymbol = (index: number, currentIndex: number | null, correctIndices: number[]) => false
	}: CibuleTaskProps = $props();

	let currentState = $state<CibuleLevelState>(CibuleLevelState.InitialDwell);
	let currentRepetition = $state<number>(0);

	let currentSymbolIndex = $state<number | null>(null);

	const currentData = $derived(() => data[currentRepetition % data.length]);
	const symbols = $derived(() => currentData().syllables.flatMap(syllable => [...syllable]));
	const correctIndices = $derived(() =>
		symbols()
			.map((symbol, index) => (symbol === currentData().correctSyllable ? index : -1))
			.filter((index) => index !== -1)
	);

	onMount(() => {
		keydownHandler = (e: KeyboardEvent) => {
			if (e.code === 'Space' || e.key === ' ') {
				e.preventDefault();
				if (currentState === CibuleLevelState.InitialDwell) {
					currentState = CibuleLevelState.Task;
				} else if (currentState === CibuleLevelState.EndDwell) {
					advanceLevel();
				}
			}
		};
		window.addEventListener('keydown', keydownHandler);
		return () => {
			window.removeEventListener('keydown', keydownHandler);
		};
	});

	$effect(() => {
		if (currentState === CibuleLevelState.InitialDwell || currentState === CibuleLevelState.EndDwell) {
			cursorVisible.set(false);
		} else {
			cursorVisible.set(true);
		}

		if (currentSymbolIndex === correctIndices()[correctIndices().length - 1]) {
			setTimeout(() => currentState = CibuleLevelState.EndDwell, 1000);
		}
	});

	onDestroy(() => {
		cursorVisible.set(true);
	});

	function advanceLevel() {
		if (currentRepetition < repetitions - 1) {
			currentRepetition += 1;
			currentState = CibuleLevelState.InitialDwell;
		} else {
			onCompleted();
		}
	}

	function validateSymbolClick(symbol: string, index: number): boolean {
		console.log('Validating symbol click:', { symbol, index, currentSymbolIndex, correctIndices: correctIndices() });
		const validationResult = validateSymbol(index, currentSymbolIndex, correctIndices())
		if (validationResult) {
			currentSymbolIndex = index;
		}
		return validationResult;
	}
</script>

<div class="flex h-screen w-full items-center justify-center">
	{#if currentState === CibuleLevelState.InitialDwell}
		<div class="fixed top-16 left-16" id={`${id}_initial}`}>
			<DwellTarget id={`${id}_initial}`}
									 dwellTimeMs={300}
									 bufferSize={50}
									 eyeWidth={150}
									 onDwellComplete={() => {
					currentState = CibuleLevelState.Task;
				}}
			/>
		</div>
	{:else if currentState === CibuleLevelState.Task}
		<div class="text-center">
			<div class="flex items-center justify-center gap-32">
				<CibuleSymbol symbol={currentData().correctSyllable ?? ""} interactable={false} />
				<div class="flex items-center justify-center gap-1">
					{#each symbols() as symbol, index (index)}
						<CibuleSymbol {symbol} {index} {validateSymbolClick} colorOnSelect={isPractice} />
					{/each}
				</div>
			</div>
		</div>
		<button class="absolute left-8 bottom-8 mt-4 px-4 py-2 bg-green-500 text-white rounded"
						onclick={() => {
				currentState = CibuleLevelState.EndDwell;
			}}
		>
			Skip
		</button>
	{:else if currentState === CibuleLevelState.EndDwell}
		<div class="fixed bottom-16 right-16" id={`${id}_end}`}>
			<DwellTarget id={`${id}_end}`}
									 dwellTimeMs={300}
									 bufferSize={50}
									 eyeWidth={150}
									 onDwellComplete={() => {
				 	advanceLevel();
				}}
			/>
		</div>
	{/if}
</div>
