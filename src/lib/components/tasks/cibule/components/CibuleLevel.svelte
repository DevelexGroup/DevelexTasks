<script lang="ts">
	import DwellTarget from '$lib/components/common/dwellTarget/DwellTarget.svelte';
	import { CibuleLevelState, type CibuleTaskProps } from '$lib/components/tasks/cibule/cibule.types';
	import { onDestroy, onMount } from 'svelte';
	import { cursorVisible } from '$lib/stores/cursor';
	import { fade } from 'svelte/transition';
	import DwellTargetArrow from '$lib/components/common/dwellTarget/DwellTargetArrow.svelte';
	import CibuleTrack from '$lib/components/tasks/cibule/components/CibuleTrack.svelte';

	let keydownHandler: (e: KeyboardEvent) => void;

	let {
		id,
		data,
		repetitions = 1,
		isPractice = false,
		onCompleted = () => {},
		validateSymbol = () => false,
		hintComponent
	}: CibuleTaskProps = $props();

	let currentState = $state<CibuleLevelState>(CibuleLevelState.InitialDwell);
	let currentRepetition = $state<number>(0);

	let currentSymbolIndex = $state<number | null>(null);

	const currentData = $derived(() => data[currentRepetition % data.length]);
	const symbols = $derived(() => currentData().syllables);

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
			currentSymbolIndex = null;
		} else {
			onCompleted();
		}
	}

	function validateSymbolClick(symbol: string, index: number): boolean {
		const validationResult = validateSymbol(index, currentSymbolIndex, currentData())
		if (validationResult) {
			currentSymbolIndex = index;
		}
		return validationResult;
	}
</script>

<div class="flex h-screen w-full items-center justify-center bg-task-background">
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
			{#if hintComponent}
			<div class="flex items-center justify-center gap-32">
				<div in:fade|global={{ delay: 500 }} out:fade|global>
					{@render hintComponent({
						symbol: currentData().correctSyllables?.[0] ?? "",
						wordToRead: currentData().wordToRead ?? "",
						isPractice
					})}
				</div>
				<div class="flex items-center justify-center" in:fade|global={{ delay: 1500 }} out:fade|global>
					<CibuleTrack symbols={symbols()} {validateSymbolClick} />
				</div>
			</div>
			{:else}
				<div class="flex items-center justify-center" in:fade|global={{ delay: 500 }} out:fade|global>
					<CibuleTrack symbols={symbols()} {validateSymbolClick} />
				</div>
			{/if}
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
