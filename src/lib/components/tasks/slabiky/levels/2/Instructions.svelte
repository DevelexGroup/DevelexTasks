<script lang="ts">
	import { instructionVideo, id } from '$lib/components/tasks/slabiky/levels/2/index';
	import { label } from '$lib/components/tasks/slabiky/index';
	import Instructions from '$lib/components/common/Instructions.svelte';

	interface Props {
		levelLabel?: string | null;
	}
	const { levelLabel = null }: Props = $props();
</script>

<Instructions {instructionVideo} {label} level={id} {levelLabel} />
