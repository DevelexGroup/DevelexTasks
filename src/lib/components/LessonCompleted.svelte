<script lang="ts">
	import Icon from '@iconify/svelte';
	import { fade } from 'svelte/transition';
	import Button from './Button.svelte';
</script>

<div
	in:fade={{ duration: 250 }}
	class="flex h-full w-full flex-col items-center justify-center gap-4 bg-green-50"
>
	<h1 class="text-3xl text-gray-700">Lesson Completed</h1>

	<div
		class="inline-flex h-14 w-14 items-center justify-center rounded-full border border-green-200 bg-gray-100"
	>
		<Icon icon="material-symbols:thumb-up-outline-rounded" class="h-8 w-8 text-green-500" />
	</div>

	<p class="mb-4 text-lg text-gray-700">You have completed the level.</p>
	<Button href="/section/">Back to Lessons</Button>
</div>
