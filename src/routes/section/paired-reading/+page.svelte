<script lang="ts">
	import { resolveAny } from '$lib/utils/resolveAny';
	import Button from '$lib/components/Button.svelte';
	import ButtonStartLesson from '$lib/components/ButtonStartLesson.svelte';
	import type { LessonConfigMap } from '$lib/types/lesson';

	interface Props {
		data: {
			config: LessonConfigMap['pairedReading']['data'][];
		};
	}

	let { data }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center space-y-4">
	<h1 class="text-3xl font-bold">Dublované čtení</h1>
	<div class="flex flex-col gap-1">
		{#each data.config as level}
			<ButtonStartLesson href={resolveAny(`/lesson/paired-reading/${level.level}`)}>
				{level.label}
			</ButtonStartLesson>
		{/each}
		<div class="mt-4 flex flex-col gap-1">
			<Button href={resolveAny('/')}>Zpět na výběr úloh</Button>
			<Button href={resolveAny('/settings')}>Změnit zařízení</Button>
		</div>
	</div>
</div>
