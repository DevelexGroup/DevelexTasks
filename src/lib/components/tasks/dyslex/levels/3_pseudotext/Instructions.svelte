<script lang="ts">
	import { instructionVideo } from '$lib/components/tasks/dyslex/levels/3_pseudotext/index';
	import { label } from '$lib/components/tasks/dyslex/levels/3_pseudotext/index';
	import Instructions from '$lib/components/common/Instructions.svelte';

	interface Props {
		levelLabel?: string | null;
	}
	const { levelLabel = null }: Props = $props();
</script>

<Instructions {instructionVideo} {label} {levelLabel} />
