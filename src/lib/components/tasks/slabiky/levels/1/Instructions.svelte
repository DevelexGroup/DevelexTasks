<script lang="ts">
	import { instructionVideo, id } from '$lib/components/tasks/slabiky/levels/1/index';
	import { label } from '$lib/components/tasks/slabiky/index';
	import Instructions from '$lib/components/common/Instructions.svelte';
</script>

<Instructions {instructionVideo} {label} level={id} />
