<script lang="ts">
	import { taskStage } from '$lib/stores/task';
	import { TaskStage } from '$lib/types/task.types';
	import { instructionVideo } from '$lib/components/tasks/fonologie/levels/2';
</script>

<div class="flex h-screen w-full items-center justify-center">
	<div class="text-center">
		<h2>Instrukce</h2>
		<div class="mx-auto max-w-4xl">
			{#if instructionVideo}
				<video class="w-full rounded" controls>
					<source src={instructionVideo} type="video/webm" />
					<track kind="captions" />
					Váš prohlížeč nepodporuje přehrávání videa.
				</video>
			{:else}
				<p>Instrukční video není k dispozici.</p>
			{/if}
		</div>
		<div class="flex items-center justify-center gap-2">
			<button
				class="mt-4 rounded bg-gray-500 px-4 py-2 text-white"
				onclick={() => taskStage.set(TaskStage.Practice)}
			>
				Zácvik
			</button>
			<button
				class="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
				onclick={() => taskStage.set(TaskStage.Task)}
			>
				Začít úkol
			</button>
		</div>
	</div>
</div>

<style>
	h2 {
		font-size: 2rem;
		margin-bottom: 1rem;
	}
</style>
