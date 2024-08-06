<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Icon from '@iconify/svelte';

	const dispatch = createEventDispatcher();

	setTimeout(() => {
		dispatch('lessonMistakeRepeat');
	}, 4500);
</script>

<div class="relative flex h-full w-full flex-col items-center justify-center">
	<div class="absolute left-0 top-0 h-full w-full bg-red-500 opacity-75 backdrop-blur-md" />
	<div class="z-20 flex flex-col items-center justify-center gap-4 p-4">
		<img src="/img/mistake.png" alt="Fail" class="h-32 w-32 object-contain object-center" />
		<p class="text-white">Chyba, Pepíčku! Znovu!</p>
	</div>
</div>
