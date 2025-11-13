<script lang="ts">

import { taskState } from '$lib/stores/task';
import { TaskState } from '$lib/types/task.types';
</script>

<div class="flex h-screen w-full items-center justify-center">
	<div class="text-center">
		<h2>Instrukce</h2>
		<p class="max-w-xl">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab, accusantium culpa cum dolorem est explicabo in iusto laboriosam mollitia non odit officiis omnis praesentium provident quo reprehenderit tempora vero, voluptas?</p>
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