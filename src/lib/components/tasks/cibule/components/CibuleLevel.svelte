<script lang="ts">
	import DwellTarget from '$lib/components/dwellTarget/DwellTarget.svelte';
	import {
		CibuleLevelState,
		type CibuleTaskProps
	} from '$lib/components/tasks/cibule/cibule.types';

	let {
		id,
		data,
		repetitions = 2,
		onCompleted = () => {}
	}: CibuleTaskProps = $props();

	let currentState = $state<CibuleLevelState>(CibuleLevelState.InitialDwell);
	let currentRepetition = $state<number>(1);

	const advanceLevel = () => {
		if (currentRepetition < repetitions) {
			currentRepetition += 1;
			currentState = CibuleLevelState.InitialDwell;
		} else {
			onCompleted();
		}
	}
</script>

<div class="flex h-screen w-full items-center justify-center">
	{#if currentState === CibuleLevelState.InitialDwell}
		<div class="fixed top-16 left-16" id={`${id}_initial}`}>
			<DwellTarget id={`${id}_initial}`}
									 dwellTimeMs={500}
									 bufferSize={50}
									 eyeWidth={150}
									 onDwellComplete={() => {
					currentState = CibuleLevelState.Task;
				}}
			/>
		</div>
	{:else if currentState === CibuleLevelState.Task}
	<div class="text-center">
		<div class="flex items-center justify-center gap-2">
			<button class="mt-4 px-4 py-2 bg-green-500 text-white rounded"
							onclick={() => {
					currentState = CibuleLevelState.EndDwell;
				}}
			>
				Splněno ({currentRepetition}/{repetitions})
			</button>
		</div>
	</div>
	{:else if currentState === CibuleLevelState.EndDwell}
		<div class="fixed bottom-16 right-16" id={`${id}_end}`}>
			<DwellTarget id={`${id}_end}`}
									 dwellTimeMs={500}
									 bufferSize={50}
									 eyeWidth={150}
									 onDwellComplete={() => {
				 	advanceLevel();
				}}
			/>
		</div>
	{/if}
</div>
