<script lang="ts">
	import DwellTarget from '$lib/components/dwellTarget/DwellTarget.svelte';
	import { CibuleLevelState, type CibuleTaskProps } from '$lib/components/tasks/cibule/cibule.types';
	import CibuleSymbol from '$lib/components/tasks/cibule/components/CibuleSymbol.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { cursorVisible } from '$lib/stores/cursor';
	import { fade } from 'svelte/transition';
	import DwellTargetArrow from '$lib/components/dwellTarget/DwellTargetArrow.svelte';

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
				} else if (currentState === CibuleLevelState.Task) {
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
		if (currentState === CibuleLevelState.InitialDwell) {
			cursorVisible.set(false);
		} else {
			cursorVisible.set(true);
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
		<div class="fixed top-16 left-16" id={`${id}_initial}`} transition:fade>
			<DwellTarget id={`${id}_initial}`}
									 dwellTimeMs={300}
									 bufferSize={50}
									 width={150}
									 onDwellComplete={() => {
									 	 currentState = CibuleLevelState.Task;
									 }}
			/>
		</div>
	{:else if currentState === CibuleLevelState.Task}
		<div class="text-center">
			<div class="flex items-center justify-center gap-32">
				<div in:fade={{ delay: 500 }} out:fade>
					<CibuleSymbol symbol={currentData().correctSyllable ?? ""} interactable={false} />
				</div>
				<div class="flex items-center justify-center gap-1" in:fade={{ delay: 1500 }} out:fade>
					{#each symbols() as symbol, index (index)}
						<CibuleSymbol {symbol} {index} {validateSymbolClick} colorOnSelect={isPractice} />
					{/each}
				</div>
			</div>
		</div>
		<div class="fixed bottom-16 right-16" id={`${id}_end}`} transition:fade>
			<DwellTarget id={`${id}_end}`}
									 dwellTimeMs={2000}
									 bufferSize={50}
									 width={150}
									 onDwellComplete={() => {
										 advanceLevel();
									 }}
			>
				<DwellTargetArrow />
			</DwellTarget>
		</div>
	{/if}
</div>
