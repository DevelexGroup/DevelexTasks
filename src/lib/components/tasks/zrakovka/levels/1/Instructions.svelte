<script lang="ts">
	import { taskState } from '$lib/stores/task';
	import { TaskState } from '$lib/types/task.types';
	import { fade } from 'svelte/transition';
</script>

<div class="flex h-screen flex-col items-center justify-center gap-8" transition:fade>
	<div>TODO: Video instrukce</div>

	<div class="flex items-center gap-4">
		<button
			class="rounded-md bg-blue-500 px-3 py-1.5 text-white"
			onclick={() => taskState.set(TaskState.Practice)}
		>
			Zácvik
		</button>
	</div>
</div>
