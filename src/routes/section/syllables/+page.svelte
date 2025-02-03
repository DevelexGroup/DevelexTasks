<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import ButtonStartLesson from '$lib/components/ButtonStartLesson.svelte';

	interface Props {
		data: {
			config: string[];
		};
	}

	let { data }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center space-y-4">
	<h1 class="text-3xl font-bold">Slabiky</h1>
	<p>Choose your level:</p>
	<div class="flex flex-col gap-1">
		{#each data.config as level}
			<ButtonStartLesson href="/lesson/syllables/{level}">
				{level}
			</ButtonStartLesson>
		{/each}
		<div class="mt-4 flex flex-col gap-1">
			<Button href="/">Back to selection</Button>
			<Button href="/settings">Change tracker</Button>
		</div>
	</div>
</div>
