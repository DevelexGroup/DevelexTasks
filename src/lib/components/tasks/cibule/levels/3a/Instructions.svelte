<script lang="ts">

import { taskState } from '$lib/stores/task';
import { TaskState } from '$lib/types/task.types';
import { instructionVideo } from '$lib/components/tasks/cibule/levels/3a/index';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
</script>

<div class="flex h-screen w-full items-center justify-center">
	<div class="text-center">
		<h2>Instrukce</h2>
		<div class="max-w-4xl mx-auto">
			<video class="w-full rounded" controls>
				<source src={instructionVideo} type="video/webm" />
				<track kind="captions" />
				Váš prohlížeč nepodporuje přehrávání videa.
			</video>
		</div>
		<div class="flex items-center justify-center gap-2">
			<button class="mt-4 px-4 py-2 bg-gray-500 text-white rounded"
							onclick={() => taskState.set(TaskState.Practice)}
			>
				Zácvik
			</button>
			<button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
							onclick={() => taskState.set(TaskState.Task)}
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