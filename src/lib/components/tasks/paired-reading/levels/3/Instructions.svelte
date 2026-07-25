<script lang="ts">
	import Instructions from '$lib/components/common/Instructions.svelte';
	import { id } from '$lib/components/tasks/paired-reading/levels/3';
	import { label } from '$lib/components/tasks/paired-reading';

	interface Props {
		levelLabel?: string | null;
	}

	const { levelLabel = null }: Props = $props();
</script>

<Instructions {label} level={id} {levelLabel} />
