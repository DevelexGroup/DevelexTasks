<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import ButtonStartLesson from '$lib/components/ButtonStartLesson.svelte';

	interface Props {
		data: {
			config: {
				level: number;
				label?: string;
			}[];
		};
	}

	let { data }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center space-y-4">
	<h1 class="text-3xl font-bold">Fonologické uvědomění a manipulace</h1>
	<p>Vyber si úroveň:</p>
	<div class="flex flex-col gap-1">
		{#each data.config as item}
			<ButtonStartLesson href="/lesson/fonologic/{item.level}">
				{item.label ?? `Úroveň ${item.level}`}
			</ButtonStartLesson>
		{/each}
		<div class="mt-4 flex flex-col gap-1">
			<Button href="/">Zpět na výběr úloh</Button>
			<Button href="/settings">Změnit zařízení</Button>
		</div>
	</div>
</div>
