<script lang="ts">
	import DwellTarget from '$lib/components/dwellTarget/DwellTarget.svelte';
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';
	import { resolveAny } from '$lib/utils/resolveAny';
	import { data } from '../../zrakovka.data';
	import { ZrakovkaTaskState } from '../../zrakovka.types';

	let currentState = $state<ZrakovkaTaskState>(ZrakovkaTaskState.LeftEye);
	let slide = $state(0);
	let currentDataIndex = 0;

	const currentData = $derived(data[1][slide]);

	const correctAudio = new Audio(resolveAny('/sound/symbolCorrect.ogg'));
	const incorrectAudio = new Audio(resolveAny('/sound/symbolMistake.ogg'));

	const correctIndeces = $derived(
		currentData.sequence
			.map((item, index) => (item === currentData.correct ? index : -1))
			.filter((index) => index !== -1)
	);

	const handleItemClick = (item: string, index: number) => {
		if (item !== currentData.correct) {
			incorrectAudio.play();

			return;
		}

		if (correctIndeces[currentDataIndex] !== index) {
			incorrectAudio.play();

			return;
		}

		correctAudio.currentTime = 0;
		correctAudio.play();
		currentDataIndex += 1;

		if (currentDataIndex >= correctIndeces.length) {
			slide += 1;
			currentDataIndex = 0;

			if (slide >= data[1].length) {
				currentState = ZrakovkaTaskState.RightEye;
			}
		}
	};
</script>

<div class="relative flex h-screen w-full bg-task-background">
	{#if currentState == ZrakovkaTaskState.LeftEye}
		<div class="absolute top-24 left-24">
			<DwellTarget
				id="practice-eye"
				dwellTimeMs={300}
				bufferSize={50}
				eyeWidth={150}
				onDwellComplete={() => (currentState = ZrakovkaTaskState.Task)}
			/>
		</div>
	{:else if currentState == ZrakovkaTaskState.Task}
		<div class="flex w-full items-center justify-center gap-24">
			<div class="h-20 w-20">
				<img
					src={resolveAny(`/images/tasks/zrakovka/${currentData.correct}.png`)}
					alt={currentData.correct}
				/>
			</div>

			<div class="flex items-center gap-4">
				{#each currentData.sequence as item, index (index)}
					<button class="h-20 w-20" onclick={() => handleItemClick(item, index)}>
						<img
							class="h-full w-full object-contain"
							src={resolveAny(`/images/tasks/zrakovka/${item}.png`)}
							alt={item}
						/>
					</button>
				{/each}
			</div>
		</div>
	{:else if currentState == ZrakovkaTaskState.RightEye}
		<div class="absolute right-24 bottom-24">
			<DwellTarget
				id="practice-eye"
				dwellTimeMs={300}
				bufferSize={50}
				eyeWidth={150}
				onDwellComplete={() => taskState.set(TaskState.Instructions)}
			/>
		</div>
	{/if}
</div>
