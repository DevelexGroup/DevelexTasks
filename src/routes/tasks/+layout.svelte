<script lang="ts">
	import DiagnosisGuard from '$lib/components/DiagnosisGuard.svelte';
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';
	import type { TaskMetadata } from '$lib/types/task.types';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	const taskModules = import.meta.glob<{ default: TaskMetadata }>('/src/lib/components/tasks/*/index.ts', {
		eager: true
	});

	let requiresDiagnosis = $derived((() => {
		const taskSlug = page.params.task;
		if (!taskSlug) return false;

		const matchingPath = Object.keys(taskModules).find((path) =>
			path.includes(`/tasks/${taskSlug}/index.ts`)
		);

		if (matchingPath) {
			const task = taskModules[matchingPath].default;
			return !!task?.diagnosticMode;
		}

		return false;
	})());
</script>

{#if requiresDiagnosis}
	<DiagnosisGuard>
		{@render children?.()}
	</DiagnosisGuard>
{:else}
	{@render children?.()}
{/if}
