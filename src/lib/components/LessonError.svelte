<script lang="ts">
	import { resolveAny } from '$lib/utils/resolveAny';
	import Button from './Button.svelte';

	interface Props {
		errorMessages?: string[];
	}

	let { errorMessages = [] }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center space-y-4">
	<h1 class="text-3xl font-bold">Hoot hoot!</h1>
	<p>Sad hoot. I am sorry, but I encountered some errors.</p>
	{#if errorMessages.length > 0}
		<ul>
			{#each errorMessages as errorMessage}
				<li>{errorMessage}</li>
			{/each}
		</ul>
	{/if}
	<Button href={resolveAny('/')}>Back to Lessons</Button>
</div>
