<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	setTimeout(() => {
		dispatch('lessonMistakeRepeat');
	}, 5000);
</script>

<div class="flex h-full w-full flex-col items-center justify-center space-y-4 bg-red-50">
	<h1 class="text-3xl font-bold text-gray-700">Tu du du du!</h1>
	<p class="text-gray-700">You failed, Pepíčku!</p>
</div>
