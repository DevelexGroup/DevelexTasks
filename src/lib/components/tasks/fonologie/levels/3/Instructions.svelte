<script lang="ts">
	import { instructionVideo, id } from '$lib/components/tasks/fonologie/levels/3/index';
	import { label } from '$lib/components/tasks/fonologie/index';
	import Instructions from '$lib/components/common/Instructions.svelte';
</script>

<Instructions {instructionVideo} {label} level={id} />
